import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/utils/mongodb";
import { Event } from "@/models/Event";
import { requireAdmin } from "@/utils/auth";
import { TicketType } from "@/models/TicketType";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  return res;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    const ticketTypes = await TicketType.find({ eventId: id })
      .sort({ createdAt: 1 })
      .lean();

    return withCors(NextResponse.json({ event, ticketTypes }, { status: 200 }));
  } catch (error) {
    console.error("Get event detail error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const body = await req.json();
    
    // --- RESOLVED CONFLICT HERE ---
    const { 
      title, 
      description, 
      location, 
      date, 
      price, 
      imageUrl, 
      isFeatured, 
      isTrending,
      ticketsTotal,
      ticketTypes,
      tags
    } = body;
    // ------------------------------

    // Debug: Log received data
    console.log("🔍 PUT /api/events/[id] - Received data:", {
      eventId: id,
      title,
      tags: body.tags,
      tagsType: typeof body.tags,
      tagsIsArray: Array.isArray(body.tags),
    });

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (location !== undefined) update.location = location;
    if (date !== undefined) update.date = date ? new Date(date) : null;
    if (imageUrl !== undefined) update.imageUrl = imageUrl;
    if (isFeatured !== undefined) update.isFeatured = isFeatured === true;
    if (isTrending !== undefined) update.isTrending = isTrending === true;
    
    // Handle tags - always process tags if provided (even if empty array)
    // Frontend should always send tags when editing, so check both destructured and body
    if (tags !== undefined || body.tags !== undefined) {
      const tagsToProcess = tags !== undefined ? tags : body.tags;
      const processedTags = Array.isArray(tagsToProcess) 
        ? tagsToProcess.filter((t: any) => typeof t === "string" && String(t).trim().length > 0).map((t: any) => String(t).trim())
        : [];
      // Always set tags (even if empty array) to ensure it's saved to database
      update.tags = processedTags;
      console.log("🔍 PUT /api/events/[id] - Processed tags:", {
        tagsFromBody: body.tags,
        tagsDestructured: tags,
        processedTags,
        processedTagsLength: processedTags.length,
        willUpdate: true,
      });
    } else {
      // If tags is not provided at all, don't update it (keep existing tags)
      console.log("⚠️ PUT /api/events/[id] - Tags not provided in request, keeping existing tags");
    }

    if (Array.isArray(ticketTypes)) {
      const cleaned = ticketTypes
        .map((t: any) => ({
          name: String(t?.name || "").trim(),
          price: Number(t?.price),
          total: Number(t?.total),
        }))
        .filter(
          (t: any) =>
            t.name &&
            Number.isFinite(t.price) &&
            t.price >= 0 &&
            Number.isFinite(t.total) &&
            t.total >= 0
        );

      if (cleaned.length === 0) {
        return NextResponse.json(
          { message: "ticketTypes không hợp lệ (phải có name, price, total)" },
          { status: 400 }
        );
      }

      const existingTypes = await TicketType.find({ eventId: id }).lean();
      const hasSoldOrHeld = existingTypes.some(
        (t: any) => Number(t.sold ?? 0) > 0 || Number(t.held ?? 0) > 0
      );
      if (hasSoldOrHeld) {
        return NextResponse.json(
          {
            message:
              "Không thể thay đổi hạng vé vì sự kiện đã có vé bán/đang giữ. Hãy tạo sự kiện mới hoặc làm chức năng chỉnh từng hạng vé riêng.",
          },
          { status: 400 }
        );
      }

      await TicketType.deleteMany({ eventId: id });
      await TicketType.insertMany(
        cleaned.map((t: any) => ({
          eventId: id,
          name: t.name,
          price: t.price,
          total: t.total,
        }))
      );

      const computedTotal = cleaned.reduce((s: number, x: any) => s + x.total, 0);
      const minPrice = cleaned.reduce((m: number, x: any) => Math.min(m, x.price), Infinity);

      update.ticketsTotal = computedTotal;
      update.price = Number.isFinite(minPrice) ? minPrice : 0;
    } else {
      if (price !== undefined) update.price = Number(price);
      if (ticketsTotal !== undefined) {
        const newTotal = Number(ticketsTotal);
        const current = await Event.findById(id).select("ticketsSold ticketsHeld").lean();
        const sold = Number((current as any)?.ticketsSold ?? 0);
        const held = Number((current as any)?.ticketsHeld ?? 0);
        if (Number.isFinite(newTotal) && newTotal < sold + held) {
          return NextResponse.json(
            { message: "Tổng vé không được nhỏ hơn số vé đã bán/đang giữ" },
            { status: 400 }
          );
        }
        update.ticketsTotal = newTotal;
      }
    }

    // Debug: Log update object before saving
    console.log("🔍 PUT /api/events/[id] - Update object:", update);
    console.log("🔍 PUT /api/events/[id] - Update object has tags:", 'tags' in update, update.tags);

    // Use $set to ensure tags is always saved, even if empty array
    // This forces Mongoose to save the tags field to database
    const updateWithSet = { $set: update };
    
    const event = await Event.findByIdAndUpdate(id, updateWithSet, {
      new: true,
      runValidators: true,
    }).lean();

    if (!event) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    // Debug: Check event returned from findByIdAndUpdate
    console.log("🔍 PUT /api/events/[id] - Event returned from update:", {
      eventId: event._id,
      eventTitle: event.title,
      tagsInReturnedEvent: event.tags,
      tagsType: typeof event.tags,
      tagsIsArray: Array.isArray(event.tags),
    });

    // Debug: Verify tags were saved to database by querying again
    const savedEvent = await Event.findById(id).lean();
    console.log("✅ PUT /api/events/[id] - Tags saved to database:", {
      eventId: id,
      eventTitle: savedEvent?.title,
      tagsInDatabase: savedEvent?.tags,
      tagsType: typeof savedEvent?.tags,
      tagsIsArray: Array.isArray(savedEvent?.tags),
      allFields: Object.keys(savedEvent || {}),
    });

    const updatedTicketTypes = await TicketType.find({ eventId: id })
      .sort({ createdAt: 1 })
      .lean();

    return withCors(NextResponse.json({ event, ticketTypes: updatedTicketTypes }, { status: 200 }));
  } catch (error) {
    console.error("Update event error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    await connectDB();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    const result = await Event.findByIdAndDelete(id).lean();
    if (!result) {
      return NextResponse.json({ message: "Không tìm thấy sự kiện" }, { status: 404 });
    }

    await TicketType.deleteMany({ eventId: id });

    return withCors(NextResponse.json({ message: "Đã xoá sự kiện" }, { status: 200 }));
  } catch (error) {
    console.error("Delete event error", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}, { status: 200 }));
}