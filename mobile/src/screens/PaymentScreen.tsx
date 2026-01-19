import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Clipboard,
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
import { getBooking, createVietQR, getImageUrl } from "../utils/api";
import { Colors } from "../constants/colors";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../constants/spacing";

type RouteProps = RouteProp<RootStackParamList, "Payment">;

type BookingDetail = {
  _id: string;
  eventTitle: string;
  ticketTypeName?: string;
  quantity: number;
  totalAmount: number;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  expiresAt?: string;
  createdAt: string;
};

type VietQRResponse = {
  bookingId: string;
  amount: number;
  addInfo: string;
  qrImageUrl: string;
  expiresAt?: string;
  receive?: {
    bankId: string;
    accountNo: string;
    accountName: string;
    template?: string;
  };
};

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatTime = (dateString?: string): string => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN");
  } catch {
    return "—";
  }
};

export default function PaymentScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { bookingId } = route.params;

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [vietqr, setVietqr] = useState<VietQRResponse | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadBookingData = async () => {
    try {
      const bookingData = await getBooking(bookingId);
      setBooking(bookingData);
      return bookingData as BookingDetail;
    } catch (err: any) {
      throw new Error(err.message || "Không tải được thông tin đơn");
    }
  };

  const loadVietQR = async () => {
    try {
      setCreating(true);
      const vqrData = await createVietQR(bookingId);
      setVietqr(vqrData);
    } catch (err: any) {
      throw new Error(err.message || "Không tạo được VietQR");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const b = await loadBookingData();
        if (b.status === "paid") {
          return; // Paid thì không cần load QR nữa
        }

        await loadVietQR();
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [bookingId]);

  // Poll status mỗi 3s để tự cập nhật
  useEffect(() => {
    if (!bookingId) return;

    const stopPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const startPoll = () => {
      stopPoll();
      pollRef.current = setInterval(async () => {
        try {
          const b = await loadBookingData();
          if (b.status === "paid" || b.status === "expired" || b.status === "failed" || b.status === "cancelled") {
            stopPoll();
          }
        } catch {
          // Silent fail
        }
      }, 3000);
    };

    startPoll();
    return () => stopPoll();
  }, [bookingId]);

  const copyAddInfo = () => {
    if (!vietqr?.addInfo) return;
    try {
      Clipboard.setString(vietqr.addInfo);
      Alert.alert("Thành công", "Đã copy nội dung chuyển khoản");
    } catch (err) {
      Alert.alert("Lỗi", "Không copy được. Bạn copy thủ công nhé.");
    }
  };

  const openQrImage = async () => {
    if (!vietqr?.qrImageUrl) return;
    try {
      const supported = await Linking.canOpenURL(vietqr.qrImageUrl);
      if (supported) {
        await Linking.openURL(vietqr.qrImageUrl);
      }
    } catch (err) {
      Alert.alert("Lỗi", "Không mở được ảnh QR");
    }
  };

  const backToHome = () => {
    navigation.navigate("MainTabs" as never);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Đang tải..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Card variant="elevated" padding="large" style={styles.errorCard}>
          <EmptyState message={error} />
          <View style={styles.errorActions}>
            <Button title="Về trang chủ" onPress={backToHome} variant="outline" />
          </View>
        </Card>
      </View>
    );
  }

  const status = booking?.status || "pending";
  const isPaid = status === "paid";
  const isBad = status === "expired" || status === "failed" || status === "cancelled";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card variant="elevated" padding="large" style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Thanh toán chuyển khoản (VietQR)</Text>
          <Text style={styles.subtitle}>
            Quét QR để chuyển khoản. Sau khi nhận tiền, admin sẽ xác nhận và đơn tự cập nhật.
          </Text>
        </View>

        {/* Success state */}
        {isPaid ? (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Thanh toán thành công</Text>
            <Text style={styles.successSubtitle}>Đơn đặt vé của bạn đã được xác nhận.</Text>
            <Button title="Về trang chủ" onPress={backToHome} size="large" style={styles.successButton} />
          </View>
        ) : (
          <>
            {/* Booking Info */}
            {booking && (
              <View style={styles.bookingInfo}>
                <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sự kiện</Text>
                  <Text style={styles.infoValue}>{booking.eventTitle}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Hạng vé</Text>
                  <Text style={styles.infoValue}>{booking.ticketTypeName || "Vé"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số lượng</Text>
                  <Text style={styles.infoValue}>{booking.quantity}</Text>
                </View>
                <View style={[styles.infoRow, styles.infoRowTotal]}>
                  <Text style={[styles.infoLabel, styles.infoLabelTotal]}>Tổng tiền</Text>
                  <Text style={[styles.infoValue, styles.infoValueTotal]}>
                    {formatMoney(booking.totalAmount)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Hết hạn giữ vé</Text>
                  <Text style={styles.infoValue}>{formatTime(booking.expiresAt)}</Text>
                </View>
                {vietqr?.addInfo && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nội dung CK</Text>
                    <Text style={[styles.infoValue, styles.addInfoText]}>{vietqr.addInfo}</Text>
                  </View>
                )}
              </View>
            )}

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <Text style={styles.sectionTitle}>Quét mã QR để thanh toán</Text>
              {vietqr?.qrImageUrl ? (
                <View style={styles.qrImageContainer}>
                  <Image source={{ uri: vietqr.qrImageUrl }} style={styles.qrImage} />
                </View>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={64} color={Colors.textLight} />
                  <Text style={styles.qrPlaceholderText}>
                    {creating ? "Đang tạo QR..." : "Chưa tạo được QR"}
                  </Text>
                </View>
              )}

              <View style={styles.qrActions}>
                <Button
                  title="Mở ảnh QR"
                  onPress={openQrImage}
                  disabled={!vietqr?.qrImageUrl}
                  variant="outline"
                  style={styles.qrActionButton}
                />
                <Button
                  title="Copy nội dung CK"
                  onPress={copyAddInfo}
                  disabled={!vietqr?.addInfo}
                  variant="outline"
                  style={styles.qrActionButton}
                />
              </View>

              <View style={styles.qrNote}>
                <Text style={styles.qrNoteLabel}>
                  <Text style={styles.qrNoteBold}>Số tiền:</Text>{" "}
                  {formatMoney(vietqr?.amount || booking?.totalAmount || 0)}
                </Text>
                <Text style={styles.qrNoteText}>
                  Sau khi bạn chuyển khoản xong, vui lòng chờ admin xác nhận. Trang sẽ tự cập nhật trạng thái.
                </Text>
              </View>
            </View>

            {/* Status */}
            <View style={[styles.statusContainer, isBad && styles.statusContainerBad]}>
              <Ionicons
                name={isBad ? "alert-circle" : "time-outline"}
                size={20}
                color={isBad ? Colors.error : Colors.warning}
              />
              <Text style={[styles.statusText, isBad && styles.statusTextBad]}>
                {status === "pending" && "⏳ Đang chờ admin xác nhận thanh toán..."}
                {isBad && "⚠️ Đơn không còn hiệu lực / thanh toán thất bại."}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button title="Về trang chủ" onPress={backToHome} variant="outline" size="large" />
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  card: {
    margin: Spacing.lg,
  },
  errorCard: {
    marginTop: Spacing.xl,
  },
  errorActions: {
    marginTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  successButton: {
    marginTop: Spacing.md,
  },
  bookingInfo: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoRowTotal: {
    borderBottomWidth: 0,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoLabelTotal: {
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
    textAlign: "right",
  },
  infoValueTotal: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  addInfoText: {
    fontWeight: FontWeight.semibold,
  },
  qrContainer: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  qrImageContainer: {
    alignItems: "center",
    marginVertical: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrImage: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  qrPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.xl,
    padding: Spacing.xl,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
  },
  qrPlaceholderText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  qrActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  qrActionButton: {
    flex: 1,
  },
  qrNote: {
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  qrNoteLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  qrNoteBold: {
    fontWeight: FontWeight.bold,
  },
  qrNoteText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: "#fef3c7",
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statusContainerBad: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.warning,
  },
  statusTextBad: {
    color: Colors.error,
  },
  actions: {
    marginTop: Spacing.md,
  },
});
