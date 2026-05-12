import { ResultTile, ScratchLine as ScratchLineData } from '../types/scratchpad';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';import ExpressionDisplay from './ExpressionDisplay';
import React from 'react';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  line: ScratchLineData;
  isActive: boolean;
  isLast: boolean;
  target: number;
  resultTile: ResultTile | null;
  resultTileUsed: boolean;
  lineNumber: number;
  lineNumberMap: Map<string, number>;
  onTokenPress: (pos: number) => void;
  onActivate: () => void;
  onResultTileTap: () => void;
}

export default function ScratchLine({
  line,
  isActive,
  isLast,
  target,
  resultTile,
  resultTileUsed,
  lineNumber,
  lineNumberMap,
  onTokenPress,
  onActivate,
  onResultTileTap,
}: Props) {
  const { theme } = useTheme();

  const resultColor =
    line.result === null ? theme.resultNull
    : line.result === target ? theme.resultExact
    : Math.abs(line.result - target) <= 10 ? theme.resultClose
    : theme.resultFar;

  const canTapResultTile = resultTile !== null && !resultTileUsed;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.row,
          { borderBottomColor: isActive ? theme.rowActiveBorder : theme.paperRule },
          isLast && styles.rowLast,
        ]}
      >
          <Text style={[styles.lineNum, { color: theme.lineNumColor }]}>{lineNumber}</Text>
          <TouchableOpacity
            style={styles.exprArea}
            onPress={onActivate}
            activeOpacity={1}
          >
            <ExpressionDisplay
              tokens={line.expression}
              cursorPos={line.cursorPos}
              result={line.result}
              target={target}
              onTokenPress={pos => { onActivate(); onTokenPress(pos); }}
              cursorActive={isActive}
              showPlaceholder={lineNumber === 1}
              lineNumberMap={lineNumberMap}
            />
          </TouchableOpacity>

          <View style={styles.rightCol}>
            {/* Result tile button */}
            {resultTile !== null && (
              <TouchableOpacity
                style={[
                  styles.resultTile,
                  { backgroundColor: theme.resultTileBg, borderColor: theme.resultTileBorder },
                  resultTileUsed && styles.resultTileUsed,
                ]}
                onPress={onResultTileTap}
                disabled={!canTapResultTile}
                activeOpacity={0.7}
              >
                <Text style={[styles.resultTileText, { color: resultColor }]}>
                  {resultTile.value}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  exprArea: {
    flex: 1,
  },
  lineNum: {
    fontSize: 11,
    width: 16,
    textAlign: 'right',
    marginRight: 6,
    alignSelf: 'center',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
  },
  resultTile: {
    height: 32,
    minWidth: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  resultTileUsed: {
    opacity: 0.35,
  },
  resultTileText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
