from .piece import Piece


class Evaluation:

    # Piece values (exact match)
    PAWN_VALUE = 100
    KNIGHT_VALUE = 300
    BISHOP_VALUE = 320
    ROOK_VALUE = 500
    QUEEN_VALUE = 900
    
    # Piece-Square Tables - EXACT match from PieceSquareTable.cs
    PAWNS = [
        0,   0,   0,   0,   0,   0,   0,   0,
        50,  50,  50,  50,  50,  50,  50,  50,
        10,  10,  20,  30,  30,  20,  10,  10,
        5,   5,  10,  25,  25,  10,   5,   5,
        0,   0,   0,  20,  20,   0,   0,   0,
        5,  -5, -10,   0,   0, -10,  -5,   5,
        5,  10,  10, -20, -20,  10,  10,   5,
        0,   0,   0,   0,   0,   0,   0,   0
    ]
    
    PAWNS_END = [
        0,   0,   0,   0,   0,   0,   0,   0,
        80,  80,  80,  80,  80,  80,  80,  80,
        50,  50,  50,  50,  50,  50,  50,  50,
        30,  30,  30,  30,  30,  30,  30,  30,
        20,  20,  20,  20,  20,  20,  20,  20,
        10,  10,  10,  10,  10,  10,  10,  10,
        10,  10,  10,  10,  10,  10,  10,  10,
        0,   0,   0,   0,   0,   0,   0,   0
    ]
    
    ROOKS = [
        0,   0,   0,   0,   0,   0,   0,   0,
        5,  10,  10,  10,  10,  10,  10,   5,
        -5,   0,   0,   0,   0,   0,   0,  -5,
        -5,   0,   0,   0,   0,   0,   0,  -5,
        -5,   0,   0,   0,   0,   0,   0,  -5,
        -5,   0,   0,   0,   0,   0,   0,  -5,
        -5,   0,   0,   0,   0,   0,   0,  -5,
        0,   0,   0,   5,   5,   0,   0,   0
    ]
    
    KNIGHTS = [
        -50, -40, -30, -30, -30, -30, -40, -50,
        -40, -20,   0,   0,   0,   0, -20, -40,
        -30,   0,  10,  15,  15,  10,   0, -30,
        -30,   5,  15,  20,  20,  15,   5, -30,
        -30,   0,  15,  20,  20,  15,   0, -30,
        -30,   5,  10,  15,  15,  10,   5, -30,
        -40, -20,   0,   5,   5,   0, -20, -40,
        -50, -40, -30, -30, -30, -30, -40, -50,
    ]
    
    BISHOPS = [
        -20, -10, -10, -10, -10, -10, -10, -20,
        -10,   0,   0,   0,   0,   0,   0, -10,
        -10,   0,   5,  10,  10,   5,   0, -10,
        -10,   5,   5,  10,  10,   5,   5, -10,
        -10,   0,  10,  10,  10,  10,   0, -10,
        -10,  10,  10,  10,  10,  10,  10, -10,
        -10,   5,   0,   0,   0,   0,   5, -10,
        -20, -10, -10, -10, -10, -10, -10, -20,
    ]
    
    QUEENS = [
        -20, -10, -10,  -5,  -5, -10, -10, -20,
        -10,   0,   0,   0,   0,   0,   0, -10,
        -10,   0,   5,   5,   5,   5,   0, -10,
        -5,    0,   5,   5,   5,   5,   0,  -5,
        0,     0,   5,   5,   5,   5,   0,  -5,
        -10,   5,   5,   5,   5,   5,   0, -10,
        -10,   0,   5,   0,   0,   0,   0, -10,
        -20, -10, -10,  -5,  -5, -10, -10, -20
    ]
    
    KING_START = [
        -80, -70, -70, -70, -70, -70, -70, -80,
        -60, -60, -60, -60, -60, -60, -60, -60,
        -40, -50, -50, -60, -60, -50, -50, -40,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -10, -20, -20, -20, -20, -20, -20, -10,
        20,   20,  -5,  -5,  -5,  -5,  20,  20,
        20,   30,  10,   0,   0,  10,  30,  20
    ]
    
    KING_END = [
        -20, -10, -10, -10, -10, -10, -10, -20,
        -5,    0,   5,   5,   5,   5,   0,  -5,
        -10,  -5,  20,  30,  30,  20,  -5, -10,
        -15, -10,  35,  45,  45,  35, -10, -15,
        -20, -15,  30,  40,  40,  30, -15, -20,
        -25, -20,  20,  25,  25,  20, -20, -25,
        -30, -25,   0,   0,   0,   0, -25, -30,
        -50, -30, -30, -30, -30, -30, -30, -50
    ]
    
    # Bonuses (exact match)
    PASSED_PAWN_BONUSES = [0, 120, 80, 50, 30, 15, 15]
    ISOLATED_PAWN_PENALTY_BY_COUNT = [0, -10, -25, -50, -75, -75, -75, -75, -75]
    KING_PAWN_SHIELD_SCORES = [4, 7, 4, 3, 6, 3]
    
    @staticmethod
    def evaluate(board):
        """
        Main evaluation - exact port of C# Evaluation.Evaluate()
        Returns score from perspective of side to move
        """
        white_eval = EvaluationData()
        black_eval = EvaluationData()
        
        # Get material info for both sides
        white_material = Evaluation._get_material_info(board, True)
        black_material = Evaluation._get_material_info(board, False)
        
        # Material score
        white_eval.material_score = white_material.material_score
        black_eval.material_score = black_material.material_score
        
        # Piece square tables
        white_eval.piece_square_score = Evaluation._evaluate_piece_square_tables(
            board, True, black_material.endgame_t
        )
        black_eval.piece_square_score = Evaluation._evaluate_piece_square_tables(
            board, False, white_material.endgame_t
        )
        
        # Mop-up evaluation (king activity in endgame)
        white_eval.mop_up_score = Evaluation._mop_up_eval(
            board, True, white_material, black_material
        )
        black_eval.mop_up_score = Evaluation._mop_up_eval(
            board, False, black_material, white_material
        )
        
        # Pawn structure
        white_eval.pawn_score = Evaluation._evaluate_pawns(board, True)
        black_eval.pawn_score = Evaluation._evaluate_pawns(board, False)
        
        # King pawn shield (king safety)
        white_eval.pawn_shield_score = Evaluation._king_pawn_shield(
            board, True, black_material, black_eval.piece_square_score
        )
        black_eval.pawn_shield_score = Evaluation._king_pawn_shield(
            board, False, white_material, white_eval.piece_square_score
        )
        
        # Total evaluation
        perspective = 1 if board.white_to_move else -1
        eval_score = white_eval.sum() - black_eval.sum()
        
        return eval_score * perspective
    
    @staticmethod
    def _get_material_info(board, is_white):
        """Get material info for one side - matches MaterialInfo struct"""
        num_pawns = 0
        num_knights = 0
        num_bishops = 0
        num_rooks = 0
        num_queens = 0
        
        color = Piece.WHITE if is_white else Piece.BLACK
        
        for square in range(64):
            piece = board.square[square]
            if piece == 0 or Piece.piece_color(piece) != color:
                continue
            
            piece_type = Piece.piece_type(piece)
            if piece_type == Piece.PAWN:
                num_pawns += 1
            elif piece_type == Piece.KNIGHT:
                num_knights += 1
            elif piece_type == Piece.BISHOP:
                num_bishops += 1
            elif piece_type == Piece.ROOK:
                num_rooks += 1
            elif piece_type == Piece.QUEEN:
                num_queens += 1
        
        return MaterialInfo(num_pawns, num_knights, num_bishops, num_queens, num_rooks)
    
    @staticmethod
    def _evaluate_piece_square_tables(board, is_white, endgame_t):
        """Evaluate piece positions - exact match"""
        value = 0
        color = Piece.WHITE if is_white else Piece.BLACK
        
        for square in range(64):
            piece = board.square[square]
            if piece == 0 or Piece.piece_color(piece) != color:
                continue
            
            piece_type = Piece.piece_type(piece)
            
            # Read square (flip for black)
            read_square = Evaluation._read_square(square, is_white)
            
            if piece_type == Piece.PAWN:
                # Interpolate between middlegame and endgame
                pawn_early = Evaluation.PAWNS[read_square]
                pawn_late = Evaluation.PAWNS_END[read_square]
                value += int(pawn_early * (1 - endgame_t))
                value += int(pawn_late * endgame_t)
            elif piece_type == Piece.ROOK:
                value += Evaluation.ROOKS[read_square]
            elif piece_type == Piece.KNIGHT:
                value += Evaluation.KNIGHTS[read_square]
            elif piece_type == Piece.BISHOP:
                value += Evaluation.BISHOPS[read_square]
            elif piece_type == Piece.QUEEN:
                value += Evaluation.QUEENS[read_square]
            elif piece_type == Piece.KING:
                # Interpolate king position
                king_early = Evaluation.KING_START[read_square]
                king_late = Evaluation.KING_END[read_square]
                value += int(king_early * (1 - endgame_t))
                value += int(king_late * endgame_t)
        
        return value
    
    @staticmethod
    def _read_square(square, is_white):
        """Read piece-square table (flip for black) - matches PieceSquareTable.Read()"""
        if is_white:
            file = square % 8
            rank = square // 8
            rank = 7 - rank
            square = rank * 8 + file
        return square
    
    @staticmethod
    def _evaluate_pawns(board, is_white):
        """Evaluate pawn structure - exact match"""
        bonus = 0
        num_isolated_pawns = 0
        
        color = Piece.WHITE if is_white else Piece.BLACK
        opponent_color = Piece.BLACK if is_white else Piece.WHITE
        
        # Collect pawns
        pawns = []
        opponent_pawns = []
        
        for square in range(64):
            piece = board.square[square]
            if Piece.piece_type(piece) == Piece.PAWN:
                if Piece.piece_color(piece) == color:
                    pawns.append(square)
                else:
                    opponent_pawns.append(square)
        
        for square in pawns:
            file = square % 8
            rank = square // 8
            
            # Check for passed pawn
            is_passed = True
            for opp_square in opponent_pawns:
                opp_file = opp_square % 8
                opp_rank = opp_square // 8
                
                # Check if opponent pawn blocks or can capture
                if abs(file - opp_file) <= 1:
                    if is_white and opp_rank > rank:
                        is_passed = False
                        break
                    elif not is_white and opp_rank < rank:
                        is_passed = False
                        break
            
            if is_passed:
                num_squares_from_promotion = (7 - rank) if is_white else rank
                bonus += Evaluation.PASSED_PAWN_BONUSES[num_squares_from_promotion]
            
            # Check for isolated pawn
            is_isolated = True
            for friend_square in pawns:
                if friend_square == square:
                    continue
                friend_file = friend_square % 8
                if abs(file - friend_file) == 1:
                    is_isolated = False
                    break
            
            if is_isolated:
                num_isolated_pawns += 1
        
        return bonus + Evaluation.ISOLATED_PAWN_PENALTY_BY_COUNT[min(num_isolated_pawns, 8)]
    
    @staticmethod
    def _king_pawn_shield(board, is_white, enemy_material, enemy_piece_square_score):
        """King pawn shield evaluation - exact match of KingPawnShield()"""
        if enemy_material.endgame_t >= 1:
            return 0
        
        penalty = 0
        color = Piece.WHITE if is_white else Piece.BLACK
        king_square = board.king_square[0 if is_white else 1]
        king_file = king_square % 8
        
        uncastled_king_penalty = 0
        
        # King should be on edge files (castled)
        if king_file <= 2 or king_file >= 5:
            # Check pawn shield
            friendly_pawn = Piece.make_piece(Piece.PAWN, color)
            
            # Simple pawn shield check (3 pawns in front of king)
            shield_squares = Evaluation._get_pawn_shield_squares(king_square, is_white)
            
            for i, shield_square in enumerate(shield_squares[:3]):
                if board.square[shield_square] != friendly_pawn:
                    # Check if pawn is one rank further
                    if i + 3 < len(shield_squares):
                        if board.square[shield_squares[i + 3]] == friendly_pawn:
                            penalty += Evaluation.KING_PAWN_SHIELD_SCORES[i + 3]
                        else:
                            penalty += Evaluation.KING_PAWN_SHIELD_SCORES[i]
                    else:
                        penalty += Evaluation.KING_PAWN_SHIELD_SCORES[i]
            
            penalty *= penalty
        else:
            # King in center - penalize based on enemy development
            enemy_development = max(0, min(1, (enemy_piece_square_score + 10) / 130.0))
            uncastled_king_penalty = int(50 * enemy_development)
        
        # Check for open files against king
        open_file_penalty = 0
        if enemy_material.num_rooks > 1 or (enemy_material.num_rooks > 0 and enemy_material.num_queens > 0):
            clamped_king_file = max(1, min(6, king_file))
            
            for attack_file in range(clamped_king_file, clamped_king_file + 2):
                is_king_file = (attack_file == king_file)
                
                # Check if file has no friendly pawns
                file_has_friendly_pawn = False
                file_has_enemy_pawn = False
                
                for square in range(64):
                    if square % 8 == attack_file:
                        piece = board.square[square]
                        if Piece.piece_type(piece) == Piece.PAWN:
                            if Piece.piece_color(piece) == color:
                                file_has_friendly_pawn = True
                            else:
                                file_has_enemy_pawn = True
                
                if not file_has_enemy_pawn:
                    open_file_penalty += 25 if is_king_file else 15
                    if not file_has_friendly_pawn:
                        open_file_penalty += 15 if is_king_file else 10
        
        # Weight by endgame phase
        pawn_shield_weight = 1 - enemy_material.endgame_t
        if enemy_material.num_queens == 0:
            pawn_shield_weight *= 0.6
        
        return int((-penalty - uncastled_king_penalty - open_file_penalty) * pawn_shield_weight)
    
    @staticmethod
    def _get_pawn_shield_squares(king_square, is_white):
        """Get pawn shield squares for king"""
        file = king_square % 8
        rank = king_square // 8
        
        # Clamp file to ensure we have adjacent files
        clamped_file = max(1, min(6, file))
        
        squares = []
        direction = 1 if is_white else -1
        
        # 3 pawns directly in front
        for file_offset in [-1, 0, 1]:
            shield_file = clamped_file + file_offset
            shield_rank = rank + direction
            if 0 <= shield_rank < 8 and 0 <= shield_file < 8:
                squares.append(shield_rank * 8 + shield_file)
        
        # 3 pawns two ranks ahead
        for file_offset in [-1, 0, 1]:
            shield_file = clamped_file + file_offset
            shield_rank = rank + direction * 2
            if 0 <= shield_rank < 8 and 0 <= shield_file < 8:
                squares.append(shield_rank * 8 + shield_file)
        
        return squares
    
    @staticmethod
    def _mop_up_eval(board, is_white, my_material, enemy_material):
        """Mop-up evaluation - exact match"""
        if my_material.material_score > enemy_material.material_score + Evaluation.PAWN_VALUE * 2:
            if enemy_material.endgame_t > 0:
                mop_up_score = 0
                friendly_king = board.king_square[0 if is_white else 1]
                opponent_king = board.king_square[1 if is_white else 0]
                
                # Orthogonal distance between kings
                friendly_file = friendly_king % 8
                friendly_rank = friendly_king // 8
                opponent_file = opponent_king % 8
                opponent_rank = opponent_king // 8
                
                orthogonal_distance = abs(friendly_file - opponent_file) + abs(friendly_rank - opponent_rank)
                
                # Encourage moving king closer
                mop_up_score += (14 - orthogonal_distance) * 4
                
                # Encourage pushing opponent king to edge (Manhattan distance from center)
                center_distance = max(abs(opponent_file - 3.5), abs(opponent_rank - 3.5))
                mop_up_score += int(center_distance * 10)
                
                return int(mop_up_score * enemy_material.endgame_t)
        
        return 0


class MaterialInfo:
    """Material info struct - exact match of C# MaterialInfo"""
    
    def __init__(self, num_pawns, num_knights, num_bishops, num_queens, num_rooks):
        self.num_pawns = num_pawns
        self.num_knights = num_knights
        self.num_bishops = num_bishops
        self.num_queens = num_queens
        self.num_rooks = num_rooks
        
        # Calculate material score
        self.material_score = (
            num_pawns * Evaluation.PAWN_VALUE +
            num_knights * Evaluation.KNIGHT_VALUE +
            num_bishops * Evaluation.BISHOP_VALUE +
            num_rooks * Evaluation.ROOK_VALUE +
            num_queens * Evaluation.QUEEN_VALUE
        )
        
        # Calculate endgame transition (0 = opening, 1 = endgame)
        QUEEN_ENDGAME_WEIGHT = 45
        ROOK_ENDGAME_WEIGHT = 20
        BISHOP_ENDGAME_WEIGHT = 10
        KNIGHT_ENDGAME_WEIGHT = 10
        
        ENDGAME_START_WEIGHT = 2 * ROOK_ENDGAME_WEIGHT + 2 * BISHOP_ENDGAME_WEIGHT + \
                              2 * KNIGHT_ENDGAME_WEIGHT + QUEEN_ENDGAME_WEIGHT
        
        endgame_weight_sum = (num_queens * QUEEN_ENDGAME_WEIGHT +
                             num_rooks * ROOK_ENDGAME_WEIGHT +
                             num_bishops * BISHOP_ENDGAME_WEIGHT +
                             num_knights * KNIGHT_ENDGAME_WEIGHT)
        
        self.endgame_t = 1 - min(1, endgame_weight_sum / ENDGAME_START_WEIGHT)


class EvaluationData:
    """Evaluation data struct - exact match of C# EvaluationData"""
    
    def __init__(self):
        self.material_score = 0
        self.mop_up_score = 0
        self.piece_square_score = 0
        self.pawn_score = 0
        self.pawn_shield_score = 0
    
    def sum(self):
        return (self.material_score + self.mop_up_score + 
                self.piece_square_score + self.pawn_score + 
                self.pawn_shield_score)