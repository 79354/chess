class MoveValidator {
  constructor(board) {
    this.board = board;
  }

  isValidMove(from, to, promotion = null) {
    const piece = this.board.getPiece(from);
    if (!piece || piece.color !== this.board.turn) {
      return false;
    }

    // ✅ FIX: Prevent capturing king
    const targetPiece = this.board.getPiece(to);
    if (targetPiece && targetPiece.type === 'king') {
      return false;
    }

    const moves = this.getPieceMoves(from);
    if (!moves.includes(to)) {
      return false;
    }

    // ✅ FIX: Check if move leaves OUR king in check
    const testBoard = this.board.clone();
    const ourColor = this.board.turn; // Save OUR color before move
    
    this.makeMove(testBoard, from, to, promotion);
    
    // Find OUR king and check if OPPONENT can attack it
    const kingSquare = this.findKing(testBoard, ourColor);
    const opponentColor = ourColor === 'white' ? 'black' : 'white';
    
    if (this.isSquareAttacked(testBoard, kingSquare, opponentColor)) {
      return false; // Move leaves our king in check
    }

    return true;
  }

  getPieceMoves(square) {
    const piece = this.board.getPiece(square);
    if (!piece) return [];

    const moveFunctions = {
      'pawn': this.getPawnMoves.bind(this),
      'knight': this.getKnightMoves.bind(this),
      'bishop': this.getBishopMoves.bind(this),
      'rook': this.getRookMoves.bind(this),
      'queen': this.getQueenMoves.bind(this),
      'king': this.getKingMoves.bind(this)
    };

    return moveFunctions[piece.type](square, piece.color);
  }

  getPawnMoves(square, color) {
    const moves = [];
    const coord = this.board.squareToCoordinate(square);
    const direction = color === 'white' ? 1 : -1;
    const startRank = color === 'white' ? 1 : 6;

    // Forward move
    const forwardFile = coord.file;
    const forwardRank = coord.rank + direction;
    if (forwardRank >= 0 && forwardRank <= 7) {
      const forwardSquare = this.board.coordToSquare(forwardFile, forwardRank);
      if (!this.board.getPiece(forwardSquare)) {
        moves.push(forwardSquare);

        // Double push from starting position
        if (coord.rank === startRank) {
          const doubleRank = coord.rank + (2 * direction);
          const doubleSquare = this.board.coordToSquare(forwardFile, doubleRank);
          if (!this.board.getPiece(doubleSquare)) {
            moves.push(doubleSquare);
          }
        }
      }
    }

    // Captures
    for (const fileDelta of [-1, 1]) {
      const captureFile = coord.file + fileDelta;
      const captureRank = coord.rank + direction;
      
      if (captureFile >= 0 && captureFile <= 7 && captureRank >= 0 && captureRank <= 7) {
        const captureSquare = this.board.coordToSquare(captureFile, captureRank);
        const targetPiece = this.board.getPiece(captureSquare);
        
        if (targetPiece && targetPiece.color !== color) {
          moves.push(captureSquare);
        }
        
        // En passant
        if (captureSquare === this.board.enPassant) {
          moves.push(captureSquare);
        }
      }
    }

    return moves;
  }

  getKnightMoves(square, color) {
    const moves = [];
    const coord = this.board.squareToCoordinate(square);
    const deltas = [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]];

    for (const [df, dr] of deltas) {
      const newFile = coord.file + df;
      const newRank = coord.rank + dr;
      
      if (newFile >= 0 && newFile <= 7 && newRank >= 0 && newRank <= 7) {
        const targetSquare = this.board.coordToSquare(newFile, newRank);
        const targetPiece = this.board.getPiece(targetSquare);
        
        if (!targetPiece || targetPiece.color !== color) {
          moves.push(targetSquare);
        }
      }
    }

    return moves;
  }

  getSlidingMoves(square, color, directions) {
    const moves = [];
    const coord = this.board.squareToCoordinate(square);

    for (const [df, dr] of directions) {
      let newFile = coord.file + df;
      let newRank = coord.rank + dr;

      while (newFile >= 0 && newFile <= 7 && newRank >= 0 && newRank <= 7) {
        const targetSquare = this.board.coordToSquare(newFile, newRank);
        const targetPiece = this.board.getPiece(targetSquare);

        if (!targetPiece) {
          moves.push(targetSquare);
        } else {
          if (targetPiece.color !== color) {
            moves.push(targetSquare);
          }
          break;
        }

        newFile += df;
        newRank += dr;
      }
    }

    return moves;
  }

  getBishopMoves(square, color) {
    return this.getSlidingMoves(square, color, [[1,1], [1,-1], [-1,1], [-1,-1]]);
  }

  getRookMoves(square, color) {
    return this.getSlidingMoves(square, color, [[1,0], [-1,0], [0,1], [0,-1]]);
  }

  getQueenMoves(square, color) {
    return this.getSlidingMoves(square, color, [
      [1,1], [1,-1], [-1,1], [-1,-1],
      [1,0], [-1,0], [0,1], [0,-1]
    ]);
  }

  getKingMoves(square, color) {
    const moves = [];
    const coord = this.board.squareToCoordinate(square);

    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;

        const newFile = coord.file + df;
        const newRank = coord.rank + dr;

        if (newFile >= 0 && newFile <= 7 && newRank >= 0 && newRank <= 7) {
          const targetSquare = this.board.coordToSquare(newFile, newRank);
          const targetPiece = this.board.getPiece(targetSquare);

          if (!targetPiece || targetPiece.color !== color) {
            moves.push(targetSquare);
          }
        }
      }
    }

    // Castling
    const kingSquare = square;
    const isKingAttacked = this.isSquareAttacked(this.board, kingSquare, color);
    
    if (!isKingAttacked) {
      const startRank = color === 'white' ? 0 : 7;

      // Kingside castling
      if ((color === 'white' && this.board.castling.K) || 
          (color === 'black' && this.board.castling.k)) {
        const f = this.board.coordToSquare(5, startRank);
        const g = this.board.coordToSquare(6, startRank);
        
        if (!this.board.getPiece(f) && !this.board.getPiece(g) &&
            !this.isSquareAttacked(this.board, f, color) &&
            !this.isSquareAttacked(this.board, g, color)) {
          moves.push(g);
        }
      }

      // Queenside castling
      if ((color === 'white' && this.board.castling.Q) || 
          (color === 'black' && this.board.castling.q)) {
        const d = this.board.coordToSquare(3, startRank);
        const c = this.board.coordToSquare(2, startRank);
        const b = this.board.coordToSquare(1, startRank);
        
        if (!this.board.getPiece(d) && !this.board.getPiece(c) && !this.board.getPiece(b) &&
            !this.isSquareAttacked(this.board, d, color) &&
            !this.isSquareAttacked(this.board, c, color)) {
          moves.push(c);
        }
      }
    }

    return moves;
  }

  getKingMovesSimple(square, color) {
    const moves = [];
    const coord = this.board.squareToCoordinate(square);

    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;

        const newFile = coord.file + df;
        const newRank = coord.rank + dr;

        if (newFile >= 0 && newFile <= 7 && newRank >= 0 && newRank <= 7) {
          const targetSquare = this.board.coordToSquare(newFile, newRank);
          const targetPiece = this.board.getPiece(targetSquare);

          if (!targetPiece || targetPiece.color !== color) {
            moves.push(targetSquare);
          }
        }
      }
    }

    return moves;
  }

  isSquareAttacked(board, square, defenderColor) {
    const attackerColor = defenderColor === 'white' ? 'black' : 'white';

    for (const [sq, piece] of Object.entries(board.board)) {
      if (piece && piece.color === attackerColor) {
        let moves;
        if (piece.type === 'king') {
          moves = this.getKingMovesSimple(sq, piece.color);
        } else {
          const tempValidator = new MoveValidator(board);
          moves = tempValidator.getPieceMoves(sq);
        }
        
        if (moves && moves.includes(square)) {
          return true;
        }
      }
    }

    return false;
  }

  findKing(board, color) {
    for (const [square, piece] of Object.entries(board.board)) {
      if (piece.type === 'king' && piece.color === color) {
        return square;
      }
    }
    return null;
  }

  makeMove(board, from, to, promotion) {
    const piece = board.getPiece(from);
    const movedPiece = {...piece};

    if (promotion && movedPiece.type === 'pawn') {
      movedPiece.type = promotion;
    }

    // ✅ FIX: Handle castling - move the rook too
    if (movedPiece.type === 'king') {
      const fromCoord = board.squareToCoordinate(from);
      const toCoord = board.squareToCoordinate(to);
      const fileDiff = toCoord.file - fromCoord.file;

      // Castling detected (king moves 2 squares)
      if (Math.abs(fileDiff) === 2) {
        const rank = fromCoord.rank;
        
        if (fileDiff === 2) {
          // Kingside castling
          const rookFrom = board.coordToSquare(7, rank);
          const rookTo = board.coordToSquare(5, rank);
          const rook = board.getPiece(rookFrom);
          if (rook) {
            board.board[rookTo] = rook;
            delete board.board[rookFrom];
          }
        } else if (fileDiff === -2) {
          // Queenside castling
          const rookFrom = board.coordToSquare(0, rank);
          const rookTo = board.coordToSquare(3, rank);
          const rook = board.getPiece(rookFrom);
          if (rook) {
            board.board[rookTo] = rook;
            delete board.board[rookFrom];
          }
        }
      }

      // Remove castling rights after king moves
      if (piece.color === 'white') {
        board.castling.K = false;
        board.castling.Q = false;
      } else {
        board.castling.k = false;
        board.castling.q = false;
      }
    }

    // Handle rook moves (remove castling rights)
    if (movedPiece.type === 'rook') {
      const fromCoord = board.squareToCoordinate(from);
      if (piece.color === 'white') {
        if (fromCoord.file === 0 && fromCoord.rank === 0) board.castling.Q = false;
        if (fromCoord.file === 7 && fromCoord.rank === 0) board.castling.K = false;
      } else {
        if (fromCoord.file === 0 && fromCoord.rank === 7) board.castling.q = false;
        if (fromCoord.file === 7 && fromCoord.rank === 7) board.castling.k = false;
      }
    }

    // Move the piece
    board.board[to] = movedPiece;
    delete board.board[from];
    
    board.turn = board.turn === 'white' ? 'black' : 'white';
  }

  getGameStatus() {
    const inCheck = this.isInCheck(this.board.turn);
    const hasLegalMoves = this.hasLegalMoves(this.board.turn);

    if (inCheck && !hasLegalMoves) {
      return {
        status: 'checkmate',
        check: this.board.turn,
        winner: this.board.turn === 'white' ? 'black' : 'white'
      };
    }

    if (!inCheck && !hasLegalMoves) {
      return {
        status: 'stalemate',
        check: null,
        winner: null
      };
    }

    return {
      status: 'ongoing',
      check: inCheck ? this.board.turn : null,
      winner: null
    };
  }

  isInCheck(color) {
    const kingSquare = this.findKing(this.board, color);
    const opponentColor = color === 'white' ? 'black' : 'white';
    return this.isSquareAttacked(this.board, kingSquare, color);
  }

  hasLegalMoves(color) {
    for (const [square, piece] of Object.entries(this.board.board)) {
      if (piece.color === color) {
        const moves = this.getPieceMoves(square);
        for (const move of moves) {
          if (this.isValidMove(square, move)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

export default MoveValidator;