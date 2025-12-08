class Board {
  constructor(fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
    this.board = {};
    this.turn = 'white';
    this.castling = { K: true, Q: true, k: true, q: true };
    this.enPassant = null;
    this.halfMoves = 0;
    this.fullMoves = 1;
    this.loadFen(fen);
  }

  loadFen(fen) {
    const parts = fen.split(' ');
    const position = parts[0];
    
    this.board = {};
    const ranks = position.split('/');
    
    for (let rankIdx = 0; rankIdx < ranks.length; rankIdx++) {
      const rank = ranks[rankIdx];
      let fileIdx = 0;
      
      for (const char of rank) {
        if (/\d/.test(char)) {
          fileIdx += parseInt(char);
        } else {
          const square = this.coordToSquare(fileIdx, 7 - rankIdx);
          this.board[square] = this.parsePiece(char);
          fileIdx++;
        }
      }
    }
    
    this.turn = parts[1] === 'w' ? 'white' : 'black';
    
    const castlingStr = parts[2];
    this.castling = {
      K: castlingStr.includes('K'),
      Q: castlingStr.includes('Q'),
      k: castlingStr.includes('k'),
      q: castlingStr.includes('q')
    };
    
    this.enPassant = parts[3] !== '-' ? parts[3] : null;
    this.halfMoves = parseInt(parts[4]);
    this.fullMoves = parseInt(parts[5]);
  }

  parsePiece(char) {
    const isWhite = char === char.toUpperCase();
    const pieceMap = {
      'p': 'pawn', 'n': 'knight', 'b': 'bishop',
      'r': 'rook', 'q': 'queen', 'k': 'king'
    };
    
    return {
      type: pieceMap[char.toLowerCase()],
      color: isWhite ? 'white' : 'black'
    };
  }

  coordToSquare(file, rank) {
    const files = 'abcdefgh';
    return `${files[file]}${rank + 1}`;
  }

  squareToCoordinate(square) {
    const files = 'abcdefgh';
    return {
      file: files.indexOf(square[0]),
      rank: parseInt(square[1]) - 1
    };
  }

  getPiece(square) {
    return this.board[square] || null;
  }

  toFen() {
    let fen = '';
    
    for (let rank = 7; rank >= 0; rank--) {
      let empty = 0;
      for (let file = 0; file < 8; file++) {
        const square = this.coordToSquare(file, rank);
        const piece = this.board[square];
        
        if (piece) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          fen += this.pieceToChar(piece);
        } else {
          empty++;
        }
      }
      
      if (empty > 0) fen += empty;
      if (rank > 0) fen += '/';
    }
    
    fen += ` ${this.turn === 'white' ? 'w' : 'b'}`;
    
    let castling = '';
    if (this.castling.K) castling += 'K';
    if (this.castling.Q) castling += 'Q';
    if (this.castling.k) castling += 'k';
    if (this.castling.q) castling += 'q';
    fen += ` ${castling || '-'}`;
    
    fen += ` ${this.enPassant || '-'}`;
    fen += ` ${this.halfMoves} ${this.fullMoves}`;
    
    return fen;
  }

  pieceToChar(piece) {
    const chars = {
      'pawn': 'p', 'knight': 'n', 'bishop': 'b',
      'rook': 'r', 'queen': 'q', 'king': 'k'
    };
    const char = chars[piece.type];
    return piece.color === 'white' ? char.toUpperCase() : char;
  }

  clone() {
    const newBoard = new Board();
    newBoard.board = JSON.parse(JSON.stringify(this.board));
    newBoard.turn = this.turn;
    newBoard.castling = { ...this.castling };
    newBoard.enPassant = this.enPassant;
    newBoard.halfMoves = this.halfMoves;
    newBoard.fullMoves = this.fullMoves;
    return newBoard;
  }
}

export default Board;