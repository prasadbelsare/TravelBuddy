import React from "react";
import { Keyboard, Platform, TouchableWithoutFeedback } from "react-native";

interface Props {
  children: React.ReactNode;
}

export function DismissKeyboardView({ children }: Props) {
  if (Platform.OS === "web") {
    return <>{children}</>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
}
