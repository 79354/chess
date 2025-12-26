class CoordinateConverter {
    /**
     * Convert algebraic notation (e.g., "e2") to board array index
     * Board is represented as 0-63 where:
     * - 0 = a1, 1 = b1, ... 7 = h1
     * - 8 = a2, 9 = b2, ... 15 = h2
     * - 56 = a8, 57 = b8, ... 63 = h8
     */
    static algebraicToIndex(square) {
      if (!square || square.length !== 2) {
        console.error('Invalid square notation:', square);
        return null;
      }
      
      const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
      const rank = parseInt(square[1]) - 1;    // '1' = 0, '2' = 1, etc.
      
      if (file < 0 || file > 7 || rank < 0 || rank > 7) {
        console.error('Square out of bounds:', square, { file, rank });
        return null;
      }
      
      return rank * 8 + file;
    }
  
    /**
     * Convert board array index to algebraic notation
     */
    static indexToAlgebraic(index) {
      if (index < 0 || index > 63) {
        console.error('Index out of bounds:', index);
        return null;
      }
      
      const file = String.fromCharCode(97 + (index % 8)); // 0 = 'a', 1 = 'b', etc.
      const rank = Math.floor(index / 8) + 1;              // 0 = '1', 1 = '2', etc.
      
      return file + rank;
    }
  
    /**
     * Parse UCI move notation to {from, to, promotion}
     * Examples: "e2e4", "e7e8q"
     */
    static parseUCI(uciMove) {
      if (!uciMove || uciMove.length < 4) {
        console.error('Invalid UCI move:', uciMove);
        return null;
      }
      
      return {
        from: uciMove.substring(0, 2),
        to: uciMove.substring(2, 4),
        promotion: uciMove.length > 4 ? uciMove[4] : null
      };
    }
  
    /**
     * Create UCI move notation from components
     */
    static toUCI(from, to, promotion = null) {
      return from + to + (promotion || '');
    }
  
    /**
     * Convert coordinate object {rank, file} to algebraic notation
     */
    static coordToAlgebraic(coord) {
      if (!coord || coord.rank === undefined || coord.file === undefined) {
        return null;
      }
      
      const file = String.fromCharCode(97 + coord.file);
      const rank = coord.rank + 1;
      return file + rank;
    }
  
    /**
     * Convert algebraic notation to coordinate object
     */
    static algebraicToCoord(square) {
      if (!square || square.length !== 2) {
        return null;
      }
      
      return {
        file: square.charCodeAt(0) - 97,
        rank: parseInt(square[1]) - 1
      };
    }
  }
  
  export default CoordinateConverter;
