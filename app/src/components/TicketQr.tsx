import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import QRCode from 'qrcode';

/** The QR code staff scan at the door. It holds the ticket code only. */
export function TicketQr({ code, size = 180 }: { code: string; size?: number }) {
  const modules = useMemo(() => QRCode.create(code, { errorCorrectionLevel: 'M' }).modules, [code]);
  const n = modules.size;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (modules.get(x, y)) cells.push(<Rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill="#16120e" />);
  return (
    <View accessibilityLabel={`Ticket QR code for ${code}`} style={{ backgroundColor: '#ffffff', padding: 14, borderRadius: 18 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${n} ${n}`}>{cells}</Svg>
    </View>
  );
}
