from .board import Board
from .move_generator import MoveGenerator
from .evaluation import Evaluation

class SearchEngine:
    def __init__(self, max_depth=4):
        self.move_generator = MoveGenerator()
        self.max_depth = max_depth
        self.nodes_searched = 0
    
    def get_best_move(self, fen):
        board = Board(fen)
        self.nodes_searched = 0
        
        best_move, best_eval = self.search(
            board, self.max_depth, 
            float('-inf'), float('inf')
        )
        
        return best_move, best_eval, self.nodes_searched
    
    def search(self, board, depth, alpha, beta):
        if depth == 0:
            self.nodes_searched += 1
            return None, Evaluation.evaluate(board)
        
        moves = self.move_generator.generate_moves(board)
        
        if not moves:
            return None, 0
        
        best_move = None
        
        for move in moves:
            original_fen = board.to_fen()
            board.make_move(move)
            
            _, eval_score = self.search(board, depth - 1, -beta, -alpha)
            eval_score = -eval_score
            
            board.load_position(original_fen)
            
            if eval_score > alpha:
                alpha = eval_score
                best_move = move
            
            if alpha >= beta:
                break
        
        return best_move, alpha
