//==============================================================================
//GameBoard class
//==============================================================================
function GameBoard(size, startingBoard) {
    this.size = size > 2 ? size : 2; //Minimum size is 2
    this.len = size * size;

    //Initialize empty board if startingBoard paramater isn't given
    this.board = startingBoard || this._initBoard();

    //Initialize empty state object
    this.state = this._initState();
}

//Initializes empty board
GameBoard.prototype._initBoard = function() {
    var board = new Array(this.len);
    for (var i = 0; i < this.len; i++) {
        board[i] = "-";
    }
    return board;
};

//Initializes empty state object
GameBoard.prototype._initState = function() {
    var state = {};
    state.mainDiag = [];
    state.antiDiag = [];
    for (var i = 0; i < this.size; i++) {
        state["col" + i] = [];
        state["row" + i] = [];
        for (var j = 0; j < this.size; j++) {
            state["col" + i][j] = this.board[i + (j * this.size)];
            state["row" + i][j] = this.board[j + (i * this.size)];
        }
        state.mainDiag[i] = this.board[i + (i * this.size)];
        state.antiDiag[i] = this.board[i + ((this.size - i - 1) * this.size)];
    }
    return state;
};

//Iterate through board and update state accordingly
GameBoard.prototype._updateState = function() {
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            this.state["col" + j][i] = this.board[j + (i * this.size)];
            this.state["row" + i][j] = this.board[j + (i * this.size)];
        }
        this.state.mainDiag[i] = this.board[i + (i * this.size)];
        this.state.antiDiag[i] = this.board[i + ((this.size - i - 1) * this.size)];
    }
};

//Marks space with given avatar and updates state
GameBoard.prototype.markSpace = function(space, avatar) {
    this.board[space] = avatar;
    this._updateState();
};

//Public method that returns board
GameBoard.prototype.getBoard = function() {
    return this.board;
};

//Returns true if space is empty
GameBoard.prototype.isSpaceEmpty = function(space) {
    return this.board[space] === "-";
};

//Returns true if every space is occupied
GameBoard.prototype.isEverySpaceOccupied = function() {
    return this.getEmptySpaces().length === 0;
};

//Returns array of all empty spaces
GameBoard.prototype.getEmptySpaces = function() {
    var emptySpaces = [];
    for (var i = 0; i < this.size * this.size; i++) {
        if (this.board[i] === "-")
            emptySpaces.push(i);
    }
    return emptySpaces;
};

//Returns array of ranks where avatar is one space away from winning formation
GameBoard.prototype.getAlmostWinRanks = function(avatar) {
    var almostWinRanks = [];
    var avatarCount, emptyCount;
    for (var rank in this.state) {
        avatarCount = 0;
        emptyCount = 0;
        for (var i = 0; i < this.state[rank].length; i++) {
            if (this.state[rank][i] === avatar)
                avatarCount++;
            else if (this.state[rank][i] === "-")
                emptyCount++;
            if (avatarCount === this.size - 1 && emptyCount === 1) {
                almostWinRanks.push(rank);
            }
        }
    }
    return almostWinRanks.length > 0 ? almostWinRanks : null;
};

//Returns array of ranks where avatar is in winning formation
GameBoard.prototype.getWinningRanks = function(avatar) {
    var winningRanks = [],
        avatarCount;
    for (var rank in this.state) {
        avatarCount = 0;
        for (var i = 0; i < this.state[rank].length; i++) {
            if (this.state[rank][i] === avatar)
                avatarCount++;
            if (avatarCount === this.size)
                winningRanks.push(rank);
        }
    }
    return winningRanks.length > 0 ? winningRanks : null;
};

//Returns true if avatar is in winning formation
GameBoard.prototype.didAvatarWin = function(avatar) {
    return this.getWinningRanks(avatar) ? true : false;
};

//Print formatted board for development purposes
// GameBoard.prototype.printBoard = function() {
//     console.log("============================================================");
//     for (var i = 0; i < this.len; i += this.size)
//         console.log(this.board.slice(i, i + this.size));
//     console.log("============================================================");
// };

//==============================================================================
//Human Class
//==============================================================================
function Human(avatar) {
    this.avatar = avatar;
}

//==============================================================================
//AI class
//==============================================================================
function AI(avatar, opponent, level) {
    this.avatar = avatar;
    this.opponent = opponent;
    this.level = level <= 3 ? level : 3; //1: easy, 2: hard, 3: unbeatable

    this._bestMove = null; //Best move as determined by minimax is stored here
    this._numMoves = 0; //Keeps track of number of moves played
}

//Returns random empty space
AI.prototype._getRandomEmptySpace = function(board) {
    var emptySpaces = board.getEmptySpaces();
    return emptySpaces[Math.floor(Math.random() * emptySpaces.length)];
};

AI.prototype._winningSpace = function(board, avatar) {
    var rank = board.getAlmostWinRanks(avatar)[0],
        b = board.getBoard(),
        size = board.size,
        space, i;

    if (rank === "mainDiag") {
        for (i = 0; i < size * size; i += size + 1) {
            if (b[i] === "-")
                space = i;
        }
    } else if (rank === "antiDiag") {
        for (i = size - 1; i < size * size; i += (size - 1)) {
            if (b[i] === "-")
                space = i;
        }
    } else if (rank.slice(0, 3) === "row") {
        for (i = 0; i < board.size; i++) {
            if (b[i + (parseInt(rank.slice(3)) * size)] === "-")
                space = i + (parseInt(rank.slice(3)) * size);
        }
    } else if (rank.slice(0, 3) === "col") {
        for (i = 0; i < board.size; i++) {
            if (b[parseInt(rank.slice(3)) + (i * size)] === "-")
                space = parseInt(rank.slice(3)) + (i * size);
        }
    }

    return space;
};

//Run minimax to determine best space to move
AI.prototype._getBestMove = function(board) {
    this._alphaBetaMinimax(board, this, -Infinity, +Infinity, 0);
    return this._bestMove;
};

//Recursively finds best move using minimax with alpha beta pruning
AI.prototype._alphaBetaMinimax = function(board, activeTurn, alpha, beta, depth) {

    depth++;

    //Return score if game is over
    if (board.didAvatarWin(this.avatar) ||
        board.didAvatarWin(this.opponent.avatar) ||
        board.isEverySpaceOccupied()) {
        return this._score(board);
    }

    var moves = board.getEmptySpaces(),
        boardClone, possibleBoard, i, currentScore;

    if (activeTurn === this) {
        for (i = 0; i < moves.length; i++) {
            boardClone = JSON.parse(JSON.stringify(board.getBoard()));
            boardClone[moves[i]] = activeTurn.avatar;
            possibleBoard = new GameBoard(board.size, boardClone);
            currentScore = this._alphaBetaMinimax(possibleBoard,
                this.opponent, alpha,
                beta, depth);

            if (currentScore > alpha) {
                alpha = currentScore;
                if (depth === 1)
                    this._bestMove = moves[i];
            }
            if (alpha >= beta)
                return alpha;
        }
        return alpha;
    } else {
        for (i = 0; i < moves.length; i++) {
            boardClone = JSON.parse(JSON.stringify(board.getBoard()));
            boardClone[moves[i]] = activeTurn.avatar;
            possibleBoard = new GameBoard(board.size, boardClone);
            currentScore = this._alphaBetaMinimax(possibleBoard,
                this, alpha,
                beta, depth);
            if (currentScore < beta)
                beta = currentScore;
            if (beta <= alpha)
                return beta;
        }
        return beta;
    }
};

//Helper function - determines score for minimax
AI.prototype._score = function(board) {
    if (board.didAvatarWin(this.avatar))
        return 10;
    else if (board.didAvatarWin(this.opponent.avatar))
        return -10;
    else
        return 0;
};

//AI decision making logic; returns next move according to level
AI.prototype.getNextMove = function(board) {

    this._numMoves++;

    var random = this._getRandomEmptySpace(board);
    var oppAlmostWin = board.getAlmostWinRanks(this.opponent.avatar);


    //Global rule - if AI has winning move, it takes it
    if (board.getAlmostWinRanks(this.avatar))
        return this._winningSpace(board, this.avatar);

    if (this.level === 1) {
        if (oppAlmostWin) {
            if (Math.random() >= 0.5)
                return this._winningSpace(board, this.opponent.avatar);
            else
                return random;
        } else
            return random;

    } else if (this.level === 2) {
        if (oppAlmostWin)
            return this._winningSpace(board, this.opponent.avatar);
        else
            return random;

    } else if (this.level === 3) {

        if ((board.size === 4 && this._numMoves < 5) ||
            (board.size === 5 && this._numMoves < 9)) {
            if (oppAlmostWin)
                return this._winningSpace(board, this.opponent.avatar);
            else
                return random;
        } else {
            return this._getBestMove(board);
        }
    }
};

//==============================================================================
//TicTacToe class
//==============================================================================
function TicTacToe(board, human, AI, DOM) {
    this.board = board;
    this.human = human;
    this.AI = AI;
    this.DOM = DOM;

    this.isGameOver = false;
}

//Makes human move on space, renders, and calls for next action
TicTacToe.prototype.humanMove = function(space) {
    if (this.isGameOver || !this.board.isSpaceEmpty(space))
        return;
    this.board.markSpace(space, this.human.avatar);
    this.DOM.render(this.board);

    //Wait 250ms before next action so gameplay feels natural
    var self = this;
    setTimeout(function() {
        self.doNextAction();
    }, 250);

};

//Makes AI move and renders
TicTacToe.prototype.AIMove = function() {
    var space = this.AI.getNextMove(this.board);
    this.board.markSpace(space, this.AI.avatar);
    this.DOM.render(this.board);
};

//Determines and performs next action
TicTacToe.prototype.doNextAction = function() {
    var winningRanks;
    //End the game and render win if human won
    if (this.board.didAvatarWin(this.human.avatar)) {
        this.isGameOver = true;
        winningRanks = this.board.getWinningRanks(this.human.avatar);
        this.DOM.renderWin(winningRanks);

        //End the game and render draw if no one won
    } else if (this.board.isEverySpaceOccupied()) {
        this.isGameOver = true;
        this.DOM.renderDraw();

        //Otherwise AI makes a move, then check for AI win or draw
    } else {
        this.AIMove();
        if (this.board.didAvatarWin(this.AI.avatar)) {
            this.isGameOver = true;
            winningRanks = this.board.getWinningRanks(this.AI.avatar);
            this.DOM.renderWin(winningRanks);
        } else if (this.board.isEverySpaceOccupied()) {
            this.isGameOver = true;
            this.DOM.renderDraw();
        }
    }
};

//==============================================================================
//DOM Methods
//==============================================================================
var DOMMethods = (function() {

    //Maps avatar representations to corresponding HTML
    var avatarMap = {
        "-": "",
        "X": '<i class="avatar fa fa-times avatar"></i>',
        "O": '<i class="avatar fa fa-circle-o avatar"></i>'
    };

    //Creates HTML board and writes it to the DOM
    var createBoard = function(size) {
        size = size <= 8 ? size : 8; //Max board size is 8

        var i, j, row, space, spaceCount = 0;

        //Clear anything that might already be there
        $("#game").html("");

        //Create and add each row
        for (i = 0; i < size; i++) {
            row = $("<div/>", {
                class: "row",
                id: "row" + i
            });
            $("#game").append(row);

            //Create and add each space
            for (j = 0; j < size; j++) {
                space = $("<a/>", {
                    id: "space" + spaceCount,
                    onclick: "function(){}",
                    class: "space clickable col" + j + " row" + i,
                    "data-space": spaceCount
                });
                $("#row" + i).append(space);
                spaceCount++;
            }
        }

        //Find main diagnol and add appropriate class
        for (j = 0; j < size * size; j += size + 1) {
            $("#space" + j).addClass("mainDiag");
        }

        //Find anti diagnol and add appropriate class
        for (j = size - 1; j < size * size - 1; j += size - 1) {
            $("#space" + j).addClass("antiDiag");
        }

        //Add appropriate classes for edges
        $(".row0").addClass("top");
        $(".col0").addClass("left");
        $(".row" + (size - 1)).addClass("bottom");
        $(".col" + (size - 1)).addClass("right");

        //Set width, height, font-size, and line-height proportional to size
        $(".space").css({
            width: 450 / size + "px",
            height: 450 / size + "px",
            "font-size": 235 / size + "px",
            "line-height": 400 / size + "px"
        });
    };

    var _reset = function() {
        window.location.reload();
    };

    //Updates DOM with contents of board
    var render = function(board) {
        var char, i;
        for (i = 0; i < board.len; i++) {
            char = board.getBoard()[i];
            $("#space" + i).html(avatarMap[char]);
        }
    };

    //Animates winning ranks and resets game
    var renderWin = function(winningRanks) {
        var winningRank1 = winningRanks[0],
            winningRank2 = winningRanks[1] || "";

        var classes = winningRank1 + " " + winningRank2 + " .avatar";
        _flash(classes);
        setTimeout(function() {
            _reset();
        }, 3000);
    };

    //Animates all spaces and resets game
    var renderDraw = function() {
        var classes = "avatar";
        _flash(classes);
        setTimeout(function() {
            _reset();
        }, 2500);
    };

    var _flash = function(classes) {
        var flash = setInterval(function() {
            $("." + classes).toggleClass("hide");
        }, 350);
        setTimeout(function() {
            clearInterval(flash);
        }, 2350);
    };

    return {
        avatarMap: avatarMap,
        createBoard: createBoard,
        render: render,
        renderWin: renderWin,
        renderDraw: renderDraw,
    };
})();


//==============================================================================
//Page iteraction
//==============================================================================
$(document).ready(function() {

    //Show modal on page load
    $(window).load(function() {
        $('#modal').modal('show');
    });

    if (window.sessionStorage.getItem("humanAvatar")) {
        var sessionHumanAvatar = window.sessionStorage.getItem("humanAvatar");
        $("button[data-avatar='" + sessionHumanAvatar + "']")
            .addClass("selected-avatar");
        $("button:not([data-avatar='" + sessionHumanAvatar + "'])")
            .removeClass("selected-avatar");
    }

    if (window.sessionStorage.getItem("AIlevel")) {
        var sessionLevel = window.sessionStorage.getItem("AIlevel");
        $("input[data-level='" + sessionLevel + "']").attr("checked", true);
        $("label[data-level='" + sessionLevel + "']").addClass("active");
        $("input:not([data-level='" + sessionLevel + "'])")
            .removeAttr("checked");
        $("lavel:not([data-level='" + sessionLevel + "'])")
            .removeClass("active");
    } else {
        $("input[data-level='2']").attr("checked", true);
        $("label[data-level='2']").addClass("active");
    }

    if (window.sessionStorage.getItem("size")) {
        var sessionSize = window.sessionStorage.getItem("size");
        $("#size").val(sessionSize);
        DOMMethods.createBoard(sessionSize);
    } else {
        DOMMethods.createBoard(3);
    }
  
    //Update board size on input change
    $("#size").change(function(event) {
        DOMMethods.createBoard(event.target.value);
    });

    //Mimic radio style buttons for avatar selection
    $("#select-x").click(function() {
        $("#select-x").addClass("selected-avatar");
        $("#select-o").removeClass("selected-avatar");
    });
    $("#select-o").click(function() {
        $("#select-o").addClass("selected-avatar");
        $("#select-x").removeClass("selected-avatar");
    });

    //When play button is pressed, start new game with selected parameters
    $("#play").click(function() {
        var humanAvatar = $(".selected-avatar").attr("data-avatar");
        var computerAvatar = $(".avatar-selection:not(.selected-avatar)")
            .attr("data-avatar");
        var AIlevel = parseInt($("input[name='difficulty']:checked")
            .attr("data-level"));
        var size = parseInt($("#size").val());
        $("#modal").modal("toggle");

        if (window.sessionStorage !== undefined) {
            window.sessionStorage.setItem("humanAvatar", humanAvatar);
            window.sessionStorage.setItem("computerAvatar", computerAvatar);
            window.sessionStorage.setItem("AIlevel", AIlevel);
            window.sessionStorage.setItem("size", size);
        }

        playGame(humanAvatar, computerAvatar, AIlevel, size);
    });


    //==============================================================================
    //GAME
    //==============================================================================
    //Controls main flow of game
    function playGame(humanAvatar, computerAvatar, AIlevel, size) {

        var human = new Human(humanAvatar);
        var computer = new AI(computerAvatar, human, AIlevel);
        var board = new GameBoard(size);
        var game = new TicTacToe(board, human, computer, DOMMethods);

        $(".space").on("click", function(event) {
            var space = event.target.getAttribute("data-space");
            game.humanMove(space);
        });

        $(".space").bind("touchstart", function(event) {
            var space = event.target.getAttribute("data-space");
            game.humanMove(space);
        })
    }
});