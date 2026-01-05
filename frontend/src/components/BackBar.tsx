import React from "react";
import { View } from "../utils/types";

type Props = {
  setView: (v: View) => void;
  fallbackView?: View; // default "home"
  label?: string;      // default "Quay lại"
  className?: string;
};

export const BackBar: React.FC<Props> = ({
  setView,
  fallbackView = "home",
  label = "Quay lại",
  className = "",
}) => {
  const goBack = () => {
    // Nếu có lịch sử trình duyệt thì quay lại
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    // fallback theo hệ thống view của bạn
    setView(fallbackView);
  };

  return (
    <div className={`backbar ${className}`}>
      <button className="btn outline" onClick={goBack}>
        ← {label}
      </button>
    </div>
  );
};
