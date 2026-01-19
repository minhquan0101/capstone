import React, { useEffect, useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../App";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { getEvent, createBooking, getImageUrl } from "../utils/api";
import { formatDateFull } from "../utils/formatters";
import { Event, TicketType } from "../utils/types";
import { useUser } from "../hooks/useUser";
import { Colors } from "../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../constants/spacing";

type RouteProps = RouteProp<RootStackParamList, "EventDetail">;

type TabType = "intro" | "ticket" | "place";

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const calculateRemaining = (total?: number, sold?: number, held?: number) => {
  const t = Number(total ?? 0);
  const s = Number(sold ?? 0);
  const h = Number(held ?? 0);
  return Math.max(0, t - s - h);
};

export default function EventDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { eventId } = route.params;
  const { user } = useUser();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabType>("intro");
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "credit_card" | "bank_transfer">("momo");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEvent(eventId);
        setEvent(data.event);
        setTicketTypes(data.ticketTypes || []);

        // Auto select first available ticket type
        if (data.ticketTypes && data.ticketTypes.length > 0) {
          const firstAvail =
            data.ticketTypes.find((t) => calculateRemaining(t.total, t.sold, t.held) > 0) ??
            data.ticketTypes[0];
          setSelectedTicketTypeId(firstAvail._id);
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải chi tiết sự kiện");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const hasTicketTypes = ticketTypes.length > 0;
  const selectedTicketType = useMemo(() => {
    if (!hasTicketTypes) return null;
    return ticketTypes.find((t) => t._id === selectedTicketTypeId) ?? null;
  }, [hasTicketTypes, ticketTypes, selectedTicketTypeId]);

  const available = useMemo(() => {
    if (!event) return 0;
    if (hasTicketTypes) {
      if (!selectedTicketType) return 0;
      return calculateRemaining(selectedTicketType.total, selectedTicketType.sold, selectedTicketType.held);
    }
    return calculateRemaining(event.ticketsTotal, event.ticketsSold, event.ticketsHeld);
  }, [event, hasTicketTypes, selectedTicketType]);

  const unitPrice = useMemo(() => {
    if (!event) return 0;
    if (hasTicketTypes) return Number(selectedTicketType?.price ?? 0);
    return Number(event.priceFrom ?? event.price ?? 0);
  }, [event, hasTicketTypes, selectedTicketType]);

  const minPrice = useMemo(() => {
    if (!event) return 0;
    return Number(event.priceFrom ?? event.price ?? 0);
  }, [event]);

  const totalAmount = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  const canSubmit = useMemo(() => {
    if (!event) return false;
    if (!user) return false;
    if (hasTicketTypes && !selectedTicketType) return false;
    if (available <= 0) return false;
    if (quantity > available) return false;
    return true;
  }, [event, user, hasTicketTypes, selectedTicketType, available, quantity]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const newQty = prev + delta;
      return Math.max(1, Math.min(newQty, available));
    });
  };

  const handleBooking = async () => {
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

    if (hasTicketTypes && !selectedTicketTypeId) {
      Alert.alert("Lỗi", "Vui lòng chọn loại vé");
      return;
    }

    if (quantity > available) {
      Alert.alert("Lỗi", "Số lượng vượt quá vé còn lại");
      return;
    }

    try {
      setSubmitting(true);
      const data = await createBooking(
        event._id,
        quantity,
        paymentMethod,
        hasTicketTypes ? selectedTicketTypeId : undefined
      );
      const bookingId = data?.booking?._id || data?.bookingId;
      
      // Nếu paymentMethod là "momo", chuyển đến PaymentScreen
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
    return <LoadingSpinner message="Đang tải..." />;
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState message={error || "Không tìm thấy sự kiện"} />
        <Button title="Quay lại" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  const imageUrl = getImageUrl(event.imageUrl);
  const hasSeatMap = event.seatMapMode && event.seatMapMode !== "none";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Ionicons name="image-outline" size={64} color={Colors.textLight} />
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <View style={styles.heroBadges}>
              {event.isFeatured && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Nổi bật</Text>
                </View>
              )}
              {event.isTrending && (
                <View style={[styles.badge, styles.badgeGhost]}>
                  <Text style={[styles.badgeText, styles.badgeTextGhost]}>Xu hướng</Text>
                </View>
              )}
              {minPrice > 0 && (
                <View style={[styles.badge, styles.badgeGhost]}>
                  <Text style={[styles.badgeText, styles.badgeTextGhost]}>
                    Giá từ {formatMoney(minPrice)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Event Info */}
        <Card variant="elevated" padding="large" style={styles.infoCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              <View style={styles.metaText}>
                <Text style={styles.metaLabel}>Thời gian</Text>
                <Text style={styles.metaValue}>{formatDateTime(event.date)}</Text>
              </View>
            </View>
            {event.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
                <View style={styles.metaText}>
                  <Text style={styles.metaLabel}>Địa điểm</Text>
                  <Text style={styles.metaValue}>{event.location}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {event.tags.map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === "intro" && styles.tabActive]}
            onPress={() => setTab("intro")}
          >
            <Text style={[styles.tabText, tab === "intro" && styles.tabTextActive]}>
              Giới thiệu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "ticket" && styles.tabActive]}
            onPress={() => setTab("ticket")}
          >
            <Text style={[styles.tabText, tab === "ticket" && styles.tabTextActive]}>
              Thông tin vé
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "place" && styles.tabActive]}
            onPress={() => setTab("place")}
          >
            <Text style={[styles.tabText, tab === "place" && styles.tabTextActive]}>Địa điểm</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <Card variant="elevated" padding="large" style={styles.contentCard}>
          {tab === "intro" && (
            <View>
              <Text style={styles.contentTitle}>Giới thiệu</Text>
              <Text style={styles.contentText}>
                {event.description?.trim() || "Chưa có mô tả."}
              </Text>
            </View>
          )}

          {tab === "ticket" && (
            <View>
              <Text style={styles.contentTitle}>Thông tin vé</Text>
              {hasTicketTypes ? (
                <View style={styles.ticketTypesList}>
                  {ticketTypes.map((t) => {
                    const remaining = calculateRemaining(t.total, t.sold, t.held);
                    return (
                      <View key={t._id} style={styles.ticketTypeRow}>
                        <View style={styles.ticketTypeLeft}>
                          <Text style={styles.ticketTypeName}>{t.name}</Text>
                          <Text style={styles.ticketTypeSub}>
                            Còn {remaining} / {t.total}
                          </Text>
                        </View>
                        <View style={styles.ticketTypeRight}>
                          <Text style={styles.ticketTypePrice}>{formatMoney(Number(t.price))}</Text>
                          <View style={[styles.statusPill, remaining <= 0 && styles.statusPillBad]}>
                            <Text style={styles.statusPillText}>
                              {remaining <= 0 ? "Hết vé" : "Còn vé"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.ticketTypeRow}>
                  <View style={styles.ticketTypeLeft}>
                    <Text style={styles.ticketTypeName}>Vé</Text>
                    <Text style={styles.ticketTypeSub}>
                      Còn {available} / {event.ticketsTotal ?? "—"}
                    </Text>
                  </View>
                  <View style={styles.ticketTypeRight}>
                    <Text style={styles.ticketTypePrice}>
                      {formatMoney(Number(event.priceFrom ?? event.price ?? 0))}
                    </Text>
                  </View>
                </View>
              )}
              <Text style={styles.note}>
                * Vé được giữ chỗ 15 phút sau khi đặt (pending).
              </Text>
            </View>
          )}

          {tab === "place" && (
            <View>
              <Text style={styles.contentTitle}>Địa điểm</Text>
              <View style={styles.placeInfo}>
                <View style={styles.placeRow}>
                  <Text style={styles.placeLabel}>Địa điểm</Text>
                  <Text style={styles.placeValue}>{event.location || "—"}</Text>
                </View>
                <View style={styles.placeRow}>
                  <Text style={styles.placeLabel}>Thời gian</Text>
                  <Text style={styles.placeValue}>{formatDateTime(event.date)}</Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Spacer for sticky button */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Sticky Buy Card */}
        <View style={styles.buyCard}>
        <View style={styles.buyCardHeader}>
          <View>
            <Text style={styles.buyCardLabel}>Giá</Text>
            <Text style={styles.buyCardPrice}>
              {hasTicketTypes ? formatMoney(unitPrice) : minPrice > 0 ? `Từ ${formatMoney(minPrice)}` : "—"}
            </Text>
          </View>
          <View style={styles.buyCardRemain}>
            <Text style={styles.buyCardLabel}>Còn lại</Text>
            <Text style={styles.buyCardRemainNum}>{available}</Text>
          </View>
        </View>

        {hasTicketTypes && (
          <View style={styles.ticketTypeSelector}>
            <Text style={styles.selectorLabel}>Chọn loại vé</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ticketTypeScroll}>
              {ticketTypes.map((t) => {
                const remaining = calculateRemaining(t.total, t.sold, t.held);
                const isSelected = t._id === selectedTicketTypeId;
                const isDisabled = remaining <= 0;
                return (
                  <TouchableOpacity
                    key={t._id}
                    style={[
                      styles.ticketTypeButton,
                      isSelected && styles.ticketTypeButtonActive,
                      isDisabled && styles.ticketTypeButtonDisabled,
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        setSelectedTicketTypeId(t._id);
                        setQuantity(1);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.ticketTypeButtonName,
                        isSelected && styles.ticketTypeButtonNameActive,
                        isDisabled && styles.ticketTypeButtonNameDisabled,
                      ]}
                    >
                      {t.name}
                    </Text>
                    <Text
                      style={[
                        styles.ticketTypeButtonPrice,
                        isSelected && styles.ticketTypeButtonPriceActive,
                        isDisabled && styles.ticketTypeButtonPriceDisabled,
                      ]}
                    >
                      {formatMoney(Number(t.price))}
                    </Text>
                    <Text
                      style={[
                        styles.ticketTypeButtonSub,
                        isSelected && styles.ticketTypeButtonSubActive,
                        isDisabled && styles.ticketTypeButtonSubDisabled,
                      ]}
                    >
                      Còn {remaining} vé
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {hasSeatMap ? (
          <>
            <View style={styles.seatNote}>
              <Ionicons name="information-circle" size={16} color={Colors.primary} />
              <Text style={styles.seatNoteText}>Sự kiện yêu cầu chọn ghế trước khi thanh toán.</Text>
            </View>
            <Button
              title="Chọn ghế & thanh toán"
              onPress={() => navigation.navigate("SeatSelect" as never, { eventId: event._id } as never)}
              size="large"
            />
          </>
        ) : (
          <>
            <View style={styles.quantitySelector}>
              <Text style={styles.selectorLabel}>Số lượng</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || submitting}
                >
                  <Ionicons name="remove" size={20} color={quantity <= 1 ? Colors.textLight : Colors.text} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, quantity >= available && styles.quantityButtonDisabled]}
                  onPress={() => handleQuantityChange(1)}
                  disabled={quantity >= available || submitting}
                >
                  <Ionicons name="add" size={20} color={quantity >= available ? Colors.textLight : Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.paymentSelector}>
              <Text style={styles.selectorLabel}>Thanh toán</Text>
              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    paymentMethod === "momo" && styles.paymentButtonActive,
                  ]}
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
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng</Text>
              <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
            </View>

            {!user ? (
              <Button
                title="Đăng nhập để đặt vé"
                onPress={() => navigation.navigate("Login" as never)}
                size="large"
              />
            ) : (
              <Button
                title={submitting ? "Đang đặt..." : "Đặt vé"}
                onPress={handleBooking}
                loading={submitting}
                disabled={!canSubmit || submitting}
                size="large"
              />
            )}

            <Text style={styles.footnote}>* Vé sẽ được giữ chỗ 15 phút (pending).</Text>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  heroContainer: {
    height: 300,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroImagePlaceholder: {
    backgroundColor: Colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeGhost: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  badgeTextGhost: {
    color: Colors.white,
  },
  infoCard: {
    margin: Spacing.lg,
    marginTop: -Spacing.xl,
    marginBottom: Spacing.md,
  },
  metaRow: {
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  metaText: {
    flex: 1,
  },
  metaLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  metaValue: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tag: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  contentCard: {
    margin: Spacing.lg,
    marginTop: 0,
  },
  contentTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  contentText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 24,
  },
  ticketTypesList: {
    gap: Spacing.md,
  },
  ticketTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ticketTypeLeft: {
    flex: 1,
  },
  ticketTypeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  ticketTypeSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  ticketTypeRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  ticketTypePrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statusPill: {
    backgroundColor: Colors.success || "#10b981",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusPillBad: {
    backgroundColor: Colors.error || "#ef4444",
  },
  statusPillText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontStyle: "italic",
  },
  placeInfo: {
    gap: Spacing.md,
  },
  placeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  placeLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  placeValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
    textAlign: "right",
  },
  spacer: {
    height: 400,
  },
  buyCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  buyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  buyCardLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  buyCardPrice: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  buyCardRemain: {
    alignItems: "flex-end",
  },
  buyCardRemainNum: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  ticketTypeSelector: {
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  ticketTypeScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  ticketTypeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
    minWidth: 120,
  },
  ticketTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  ticketTypeButtonDisabled: {
    opacity: 0.5,
  },
  ticketTypeButtonName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  ticketTypeButtonNameActive: {
    color: Colors.primary,
  },
  ticketTypeButtonNameDisabled: {
    color: Colors.textLight,
  },
  ticketTypeButtonPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  ticketTypeButtonPriceActive: {
    color: Colors.primary,
  },
  ticketTypeButtonPriceDisabled: {
    color: Colors.textLight,
  },
  ticketTypeButtonSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  ticketTypeButtonSubActive: {
    color: Colors.primary,
  },
  ticketTypeButtonSubDisabled: {
    color: Colors.textLight,
  },
  quantitySelector: {
    marginBottom: Spacing.md,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    minWidth: 40,
    textAlign: "center",
  },
  paymentSelector: {
    marginBottom: Spacing.md,
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
  seatNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#eff6ff",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  seatNoteText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  footnote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
