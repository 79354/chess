from .piece import Piece
from .move import Move

class Board:
    """Chess board with FEN support"""
    START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    
    def __init__(self, fen=None):
        self.square = [0] * 64
        self.white_to_move = True
        self.castling_rights = 0
        self.en_passant_file = 0
        self.fifty_move_counter = 0
        self.move_count = 1
        self.king_square = [0, 0]
        
        if fen is None:
            fen = Board.START_FEN
        self.load_position(fen)
    
    def load_position(self, fen):
        """Load from FEN string"""
        self.square = [0] * 64
        parts = fen.split()
        
        rank = 7
        file = 0
        for char in parts[0]:
            if char == '/':
                rank -= 1
                file = 0
            elif char.isdigit():
                file += int(char)
            else:
                piece_type = {
                    'p': Piece.PAWN, 'n': Piece.KNIGHT, 'b': Piece.BISHOP,
                    'r': Piece.ROOK, 'q': Piece.QUEEN, 'k': Piece.KING
                }[char.lower()]
                
                color = Piece.WHITE if char.isupper() else Piece.BLACK
                piece = Piece.make_piece(piece_type, color)
                
                square_index = rank * 8 + file
                self.square[square_index] = piece
                
                if piece_type == Piece.KING:
                    self.king_square[0 if color == Piece.WHITE else 1] = square_index
                
                file += 1
        
        self.white_to_move = parts[1] == 'w'
        
        self.castling_rights = 0
        if 'K' in parts[2]:
            self.castling_rights |= 1
        if 'Q' in parts[2]:
            self.castling_rights |= 2
        if 'k' in parts[2]:
            self.castling_rights |= 4
        if 'q' in parts[2]:
            self.castling_rights |= 8
        
        if parts[3] != '-':
            self.en_passant_file = ord(parts[3][0]) - ord('a') + 1
        else:
            self.en_passant_file = 0
        
        if len(parts) > 4:
            self.fifty_move_counter = int(parts[4])
        if len(parts) > 5:
            self.move_count = int(parts[5])
    
    def to_fen(self):
        """Convert to FEN string"""
        fen_parts = []
        
        for rank in range(7, -1, -1):
            empty = 0
            rank_str = ""
            for file in range(8):
                square = rank * 8 + file
                piece = self.square[square]
                if piece == 0:
                    empty += 1
                else:
                    if empty > 0:
                        rank_str += str(empty)
                        empty = 0
                    rank_str += Piece.get_symbol(piece)
            if empty > 0:
                rank_str += str(empty)
            fen_parts.append(rank_str)
        
        fen = '/'.join(fen_parts)
        fen += ' w' if self.white_to_move else ' b'
        
        castling = ''
        if self.castling_rights & 1:
            castling += 'K'
        if self.castling_rights & 2:
            castling += 'Q'
        if self.castling_rights & 4:
            castling += 'k'
        if self.castling_rights & 8:
            castling += 'q'
        fen += ' ' + (castling if castling else '-')
        
        if self.en_passant_file > 0:
            file = chr(ord('a') + self.en_passant_file - 1)
            rank = '6' if self.white_to_move else '3'
            fen += f' {file}{rank}'
        else:
            fen += ' -'
        
        fen += f' {self.fifty_move_counter} {self.move_count}'
        
        return fen
    
    def make_move(self, move):
        """Apply move to board"""
        start = move.start_square
        target = move.target_square
        piece = self.square[start]
        
        self.square[target] = piece
        self.square[start] = 0
        
        if Piece.piece_type(piece) == Piece.KING:
            color_index = 0 if Piece.is_white(piece) else 1
            self.king_square[color_index] = target
        
        if move.flag == Move.EN_PASSANT_FLAG:
            offset = -8 if self.white_to_move else 8
            self.square[target + offset] = 0
        
        elif move.flag == Move.CASTLE_FLAG:
            if target == 6 or target == 62:
                rook_start = target + 1
                rook_target = target - 1
            else:
                rook_start = target - 2
                rook_target = target + 1
            self.square[rook_target] = self.square[rook_start]
            self.square[rook_start] = 0
        
        elif move.is_promotion:
            promo_map = {
                Move.PROMOTE_TO_QUEEN_FLAG: Piece.QUEEN,
                Move.PROMOTE_TO_KNIGHT_FLAG: Piece.KNIGHT,
                Move.PROMOTE_TO_ROOK_FLAG: Piece.ROOK,
                Move.PROMOTE_TO_BISHOP_FLAG: Piece.BISHOP
            }
            promo_type = promo_map.get(move.flag, Piece.QUEEN)
            color = Piece.piece_color(piece)
            self.square[target] = Piece.make_piece(promo_type, color)
        
        self.en_passant_file = 0
        if move.flag == Move.PAWN_TWO_UP_FLAG:
            self.en_passant_file = (start % 8) + 1
        
        if Piece.piece_type(piece) == Piece.KING:
            if self.white_to_move:
                self.castling_rights &= 0b1100
            else:
                self.castling_rights &= 0b0011
        
        self.white_to_move = not self.white_to_move
        if not self.white_to_move:
            self.move_count += 1