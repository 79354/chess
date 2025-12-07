class Piece:
    """Piece types and colors"""
    NONE = 0
    PAWN = 1
    KNIGHT = 2
    BISHOP = 3
    ROOK = 4
    QUEEN = 5
    KING = 6
    
    WHITE = 0
    BLACK = 8
    
    @staticmethod
    def make_piece(piece_type, color):
        return piece_type | color
    
    @staticmethod
    def piece_type(piece):
        return piece & 0b0111
    
    @staticmethod
    def piece_color(piece):
        return piece & 0b1000
    
    @staticmethod
    def is_white(piece):
        return Piece.piece_color(piece) == Piece.WHITE and piece != 0
    
    @staticmethod
    def is_color(piece, color):
        return Piece.piece_color(piece) == color and piece != 0
    
    @staticmethod
    def get_symbol(piece):
        piece_type = Piece.piece_type(piece)
        symbols = {
            Piece.ROOK: 'R', Piece.KNIGHT: 'N', Piece.BISHOP: 'B',
            Piece.QUEEN: 'Q', Piece.KING: 'K', Piece.PAWN: 'P'
        }
        symbol = symbols.get(piece_type, ' ')
        return symbol if Piece.is_white(piece) else symbol.lower()