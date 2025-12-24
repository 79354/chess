"""
Move Ordering for better alpha-beta pruning.
Based on Chess-Coding-Adventure/src/Core/Search/MoveOrdering.cs
"""

from .piece import Piece

class MoveOrdering:
    """Orders moves to improve alpha-beta search efficiency"""
    
    # Score biases for different move types
    HASH_MOVE_SCORE = 100_000_000
    WINNING_CAPTURE_BIAS = 8_000_000
    PROMOTE_BIAS = 6_000_000
    KILLER_BIAS = 4_000_000
    LOSING_CAPTURE_BIAS = 2_000_000
    REGULAR_BIAS = 0
    
    MAX_KILLER_MOVE_PLY = 32
    
    # Piece values for MVV-LVA
    PIECE_VALUES = {
        Piece.PAWN: 100,
        Piece.KNIGHT: 300,
        Piece.BISHOP: 320,
        Piece.ROOK: 500,
        Piece.QUEEN: 900,
        Piece.KING: 0
    }
    
    def __init__(self):
        """Initialize move ordering"""
        self.killer_moves = [[None, None] for _ in range(self.MAX_KILLER_MOVE_PLY)]
        # History[color][from_square][to_square]
        self.history = [[[0 for _ in range(64)] for _ in range(64)] for _ in range(2)]
    
    def clear_history(self):
        """Clear history heuristic"""
        self.history = [[[0 for _ in range(64)] for _ in range(64)] for _ in range(2)]
    
    def clear_killers(self):
        """Clear killer moves"""
        self.killer_moves = [[None, None] for _ in range(self.MAX_KILLER_MOVE_PLY)]
    
    def clear(self):
        """Clear all move ordering data"""
        self.clear_history()
        self.clear_killers()
    
    def add_killer_move(self, move, ply):
        """Add a killer move at given ply"""
        if ply < self.MAX_KILLER_MOVE_PLY:
            if self.killer_moves[ply][0] != move:
                self.killer_moves[ply][1] = self.killer_moves[ply][0]
                self.killer_moves[ply][0] = move
    
    def is_killer_move(self, move, ply):
        """Check if move is a killer move"""
        if ply >= self.MAX_KILLER_MOVE_PLY:
            return False
        return (move == self.killer_moves[ply][0] or 
                move == self.killer_moves[ply][1])
    
    def order_moves(self, moves, board, hash_move, ply_from_root):
        """
        Order moves for better alpha-beta search.
        Returns list of (move, score) tuples sorted by score (highest first).
        """
        move_scores = []
        
        for move in moves:
            score = self._score_move(move, board, hash_move, ply_from_root)
            move_scores.append((move, score))
        
        # Sort by score (descending)
        move_scores.sort(key=lambda x: x[1], reverse=True)
        return [move for move, score in move_scores]
    
    def _score_move(self, move, board, hash_move, ply_from_root):
        """Score a single move"""
        # Hash move gets highest priority
        if hash_move and move.value == hash_move.value:
            return self.HASH_MOVE_SCORE
        
        score = 0
        start_square = move.start_square
        target_square = move.target_square
        
        moved_piece = board.square[start_square]
        moved_piece_type = Piece.piece_type(moved_piece)
        captured_piece = board.square[target_square]
        captured_piece_type = Piece.piece_type(captured_piece)
        
        is_capture = captured_piece != 0
        
        # Captures
        if is_capture:
            # MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
            moved_value = self.PIECE_VALUES.get(moved_piece_type, 0)
            captured_value = self.PIECE_VALUES.get(captured_piece_type, 0)
            capture_delta = captured_value - moved_value
            
            # Good captures (winning material or equal)
            if capture_delta >= 0:
                score = self.WINNING_CAPTURE_BIAS + capture_delta
            else:
                score = self.LOSING_CAPTURE_BIAS + capture_delta
        
        # Promotions
        if move.is_promotion:
            score = self.PROMOTE_BIAS
        
        # Quiet moves
        if not is_capture:
            # Killer moves
            if self.is_killer_move(move, ply_from_root):
                score = self.KILLER_BIAS
            else:
                score = self.REGULAR_BIAS
            
            # History heuristic
            color_index = 0 if board.white_to_move else 1
            score += self.history[color_index][start_square][target_square]
        
        return score
    
    def update_history(self, move, board, depth):
        """Update history heuristic for a good quiet move"""
        color_index = 0 if board.white_to_move else 1
        history_bonus = depth * depth
        self.history[color_index][move.start_square][move.target_square] += history_bonus