import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../App";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { useUser } from "../hooks/useUser";
import { Colors } from "../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../constants/spacing";
import { Event, SeatMapJson, SeatMapJsonSeat, SeatMapJsonZone, TicketType } from "../utils/types";
import { createBookingWithSeats, getEvent, getSeatStatus } from "../utils/api";

type RouteProps = RouteProp<RootStackParamList, "SeatSelect">;

type SeatStatus = {
  soldSeatIds: string[];
  heldSeatIds: string[];
};

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getSeatMapSize = (map?: SeatMapJson) => {
  if (!map) return { width: 0, height: 0 };
  if (map.width && map.height) return { width: map.width, height: map.height };

  const seats = map.seats || [];
  const zones = map.zones || [];
  const allX = [
    ...seats.map((s) => s.x),
    ...zones.map((z) => z.x + z.width),
  ];
  const allY = [
    ...seats.map((s) => s.y),
    ...zones.map((z) => z.y + z.height),
  ];
  return {
    width: Math.max(0, ...allX),
    height: Math.max(0, ...allY),
  };
};

export default function SeatSelectScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { eventId } = route.params;
  const { user } = useUser();
  const { width: screenWidth } = useWindowDimensions();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [map, setMap] = useState<SeatMapJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SeatStatus>({ soldSeatIds: [], heldSeatIds: [] });
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "credit_card" | "bank_transfer">("momo");
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEvent(eventId);
        setEvent(data.event);
        setTicketTypes(data.ticketTypes || []);
        setMap(data.event.seatMapJson || null);
      } catch (err: any) {
        setError(err.message || "Không thể tải sơ đồ ghế");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [eventId]);

  const mapSize = useMemo(() => getSeatMapSize(map || undefined), [map]);
  const baseScale = useMemo(() => {
    if (!mapSize.width) return 1;
    return Math.min(1, (screenWidth - Spacing.xl * 2) / mapSize.width);
  }, [mapSize.width, screenWidth]);

  useEffect(() => {
    setScale(baseScale);
  }, [baseScale]);

  const seats = useMemo<SeatMapJsonSeat[]>(() => {
    return Array.isArray(map?.seats) ? map!.seats! : [];
  }, [map]);

  const zones = useMemo<SeatMapJsonZone[]>(() => {
    return Array.isArray(map?.zones) ? map!.zones! : [];
  }, [map]);

  const allItems = useMemo(() => {
    if (seats.length > 0) return seats.map((s) => ({ kind: "seat" as const, ...s }));
    return zones.map((z) => ({ kind: "zone" as const, ...z }));
  }, [seats, zones]);

  const blockedSet = useMemo(() => new Set([...status.soldSeatIds, ...status.heldSeatIds]), [status]);

  const selectedEntries = useMemo(() => Object.entries(selected), [selected]);

  const selectedByType = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    selectedEntries.forEach(([seatId, typeId]) => {
      (grouped[typeId] ||= []).push(seatId);
    });
    Object.keys(grouped).forEach((k) => grouped[k].sort());
    return grouped;
  }, [selectedEntries]);

  const totalAmount = useMemo(() => {
    const priceById: Record<string, number> = {};
    ticketTypes.forEach((t) => (priceById[t._id] = Number(t.price || 0)));
    return selectedEntries.reduce((sum, [, tid]) => sum + (priceById[tid] || 0), 0);
  }, [selectedEntries, ticketTypes]);

  useEffect(() => {
    if (!eventId) return;
    const startPoll = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const data = await getSeatStatus(eventId);
          setStatus(data);
        } catch {
          // ignore
        }
      }, 3000);
    };
    startPoll();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [eventId]);

  useEffect(() => {
    if (selectedEntries.length === 0) return;
    if (blockedSet.size === 0) return;
    const next: Record<string, string> = { ...selected };
    let changed = false;
    selectedEntries.forEach(([seatId]) => {
      if (blockedSet.has(seatId)) {
        delete next[seatId];
        changed = true;
      }
    });
    if (changed) setSelected(next);
  }, [blockedSet, selectedEntries, selected]);

  const toggleSeat = (seatId: string, ticketTypeId: string) => {
    if (blockedSet.has(seatId)) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[seatId]) delete next[seatId];
      else next[seatId] = ticketTypeId;
      return next;
    });
  };

  const handleContinue = async () => {
    if (!user) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để đặt vé", [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng nhập", onPress: () => navigation.navigate("Login" as never) },
      ]);
      return;
    }

    if (!event) {
      Alert.alert("Lỗi", "Không có dữ liệu sự kiện");
      return;
    }

    if (selectedEntries.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ghế trước khi thanh toán");
      return;
    }

    const seatsPayload = selectedEntries.map(([seatId, ticketTypeId]) => ({
      seatId,
      ticketTypeId,
    }));

    try {
      setSubmitting(true);
      const data = await createBookingWithSeats(event._id, seatsPayload, paymentMethod);
      const bookingId = data?.booking?._id || data?.bookingId;

      if (paymentMethod === "momo" && bookingId) {
        navigation.navigate("Payment" as never, { bookingId: String(bookingId) });
      } else {
        Alert.alert("Thành công", "Đặt vé thành công! Vé đang được giữ chỗ 15 phút.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Đặt vé thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Đang tải sơ đồ ghế..." />;
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState message={error || "Không tìm thấy sự kiện"} />
        <Button title="Quay lại" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  if (!map || allItems.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState message="Sự kiện chưa có sơ đồ ghế" />
        <Button title="Quay lại" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  const mapWidth = mapSize.width * scale;
  const mapHeight = mapSize.height * scale;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.subtitle}>Chọn ghế • Zoom {Math.round(scale * 100)}%</Text>
        </View>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
          >
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={() => setScale(baseScale)}>
            <Text style={styles.zoomText}>100%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => setScale((s) => Math.min(2.2, +(s + 0.1).toFixed(2)))}
          >
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Card variant="elevated" padding="large" style={styles.mapCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.mapCanvas, { width: mapWidth, height: mapHeight }]}>
              {allItems.map((item) => {
                if (item.kind === "seat") {
                  const isSelected = !!selected[item.seatId];
                  const isBlocked = blockedSet.has(item.seatId);
                  const left = item.x * scale;
                  const top = item.y * scale;
                  return (
                    <TouchableOpacity
                      key={item.seatId}
                      style={[
                        styles.seat,
                        { left, top },
                        isBlocked && styles.seatBlocked,
                        isSelected && styles.seatSelected,
                      ]}
                      onPress={() => toggleSeat(item.seatId, item.ticketTypeId)}
                      activeOpacity={0.8}
                    />
                  );
                }

                const isSelected = !!selected[item.zoneId];
                const isBlocked = blockedSet.has(item.zoneId);
                const left = item.x * scale;
                const top = item.y * scale;
                const width = item.width * scale;
                const height = item.height * scale;
                return (
                  <TouchableOpacity
                    key={item.zoneId}
                    style={[
                      styles.zone,
                      { left, top, width, height },
                      isBlocked && styles.seatBlocked,
                      isSelected && styles.seatSelected,
                    ]}
                    onPress={() => toggleSeat(item.zoneId, item.ticketTypeId)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.zoneLabel} numberOfLines={1}>
                      {item.label || item.zoneId}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendAvailable]} />
              <Text style={styles.legendText}>Trống</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendSelected]} />
              <Text style={styles.legendText}>Đang chọn</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendBlocked]} />
              <Text style={styles.legendText}>Đã chọn</Text>
            </View>
          </View>
        </Card>

        <Card variant="elevated" padding="large" style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Ghế đã chọn</Text>
          {selectedEntries.length === 0 ? (
            <Text style={styles.emptyText}>Chọn ghế trên sơ đồ để tiếp tục.</Text>
          ) : (
            Object.entries(selectedByType).map(([typeId, seats]) => {
              const type = ticketTypes.find((t) => t._id === typeId);
              const price = Number(type?.price || 0);
              return (
                <View key={typeId} style={styles.selectedGroup}>
                  <View style={styles.selectedHeader}>
                    <Text style={styles.selectedTitle}>
                      {type?.name || "Hạng vé"} ({seats.length})
                    </Text>
                    <Text style={styles.selectedPrice}>{formatMoney(price * seats.length)}</Text>
                  </View>
                  <Text style={styles.selectedSeats}>{seats.join(", ")}</Text>
                </View>
              );
            })
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền</Text>
            <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
          </View>
        </Card>

        <Card variant="elevated" padding="large" style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={[styles.paymentButton, paymentMethod === "momo" && styles.paymentButtonActive]}
              onPress={() => setPaymentMethod("momo")}
            >
              <Text
                style={[
                  styles.paymentButtonText,
                  paymentMethod === "momo" && styles.paymentButtonTextActive,
                ]}
              >
                MoMo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                paymentMethod === "credit_card" && styles.paymentButtonActive,
              ]}
              onPress={() => setPaymentMethod("credit_card")}
            >
              <Text
                style={[
                  styles.paymentButtonText,
                  paymentMethod === "credit_card" && styles.paymentButtonTextActive,
                ]}
              >
                Thẻ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentButton,
                paymentMethod === "bank_transfer" && styles.paymentButtonActive,
              ]}
              onPress={() => setPaymentMethod("bank_transfer")}
            >
              <Text
                style={[
                  styles.paymentButtonText,
                  paymentMethod === "bank_transfer" && styles.paymentButtonTextActive,
                ]}
              >
                CK
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.footer}>
          <Button
            title={submitting ? "Đang đặt..." : "Tiếp tục thanh toán"}
            onPress={handleContinue}
            loading={submitting}
            disabled={submitting || selectedEntries.length === 0}
            size="large"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomControls: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  zoomButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  zoomText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  mapCard: {
    padding: Spacing.lg,
  },
  mapCanvas: {
    position: "relative",
    backgroundColor: "#0f172a",
    borderRadius: BorderRadius.lg,
  },
  seat: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  zone: {
    position: "absolute",
    borderRadius: BorderRadius.md,
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  zoneLabel: {
    color: Colors.white,
    fontSize: FontSize.xs,
    textAlign: "center",
  },
  seatSelected: {
    backgroundColor: Colors.success || "#22c55e",
    borderColor: Colors.success || "#22c55e",
  },
  seatBlocked: {
    backgroundColor: Colors.gray300,
    borderColor: Colors.gray300,
    opacity: 0.7,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendAvailable: {
    backgroundColor: Colors.white,
  },
  legendSelected: {
    backgroundColor: Colors.success || "#22c55e",
  },
  legendBlocked: {
    backgroundColor: Colors.gray300,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  summaryCard: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  emptyText: {
    color: Colors.textSecondary,
  },
  selectedGroup: {
    marginBottom: Spacing.md,
  },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectedTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  selectedPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  selectedSeats: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  paymentCard: {
    gap: Spacing.md,
  },
  paymentButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: "center",
  },
  paymentButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  paymentButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  paymentButtonTextActive: {
    color: Colors.primary,
  },
  footer: {
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
});
