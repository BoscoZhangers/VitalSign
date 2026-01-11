export function mapGestureToText(gesture) {
  if (!gesture || !gesture.gestures.length) return "";

  const name = gesture.gestures[0][0].categoryName;

  const map = {
    Open_Palm: "HELLO",
    Closed_Fist: "STOP",
    Thumb_Up: "YES",
    Thumb_Down: "NO",
    Pointing_Up: "LOOK",
  };

  return map[name] || "";
}

