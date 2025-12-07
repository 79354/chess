from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

from .engine.board import Board
from .engine.move import Move
from .engine.search import SearchEngine

# Initialize search engine
search_engine = SearchEngine(max_depth=4)

@csrf_exempt
@require_http_methods(["POST"])
def get_bot_move(request):
    """Get the best move from the bot"""
    try:
        data = json.loads(request.body)
        fen = data.get('fen', Board.START_FEN)
        
        best_move, evaluation, nodes = search_engine.get_best_move(fen)
        
        if best_move is None:
            return JsonResponse({
                'success': False,
                'error': 'No legal moves available'
            }, status=400)
        
        return JsonResponse({
            'success': True,
            'move': best_move.to_uci(),
            'evaluation': evaluation,
            'nodes_searched': nodes
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def validate_move(request):
    """Validate if a move is legal"""
    try:
        data = json.loads(request.body)
        fen = data.get('fen')
        move_uci = data.get('move')
        
        if not fen or not move_uci:
            return JsonResponse({
                'success': False,
                'error': 'Missing fen or move'
            }, status=400)
        
        board = Board(fen)
        move = Move.from_uci(move_uci)
        
        from .engine.move_generator import MoveGenerator
        gen = MoveGenerator()
        legal_moves = gen.generate_moves(board)
        legal_moves_uci = [m.to_uci() for m in legal_moves]
        
        is_legal = move_uci in legal_moves_uci
        
        if is_legal:
            board.make_move(move)
            new_fen = board.to_fen()
        else:
            new_fen = None
        
        return JsonResponse({
            'success': True,
            'legal': is_legal,
            'new_fen': new_fen,
            'legal_moves': legal_moves_uci
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'chess-bot'
    })
