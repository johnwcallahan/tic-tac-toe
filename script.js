$(document).ready(function() {
    //set FontAwesome icons to variables
    var x = '<i class="fa fa-times icon" aria-hidden="true"></i>';
    var o = '<i class="fa fa-circle-o icon" aria-hidden="true"></i>';
    var xHover = '<i class="fa fa-times icon hover" aria-hidden="true"></i>';
    var oHover = '<i class="fa fa-circle-o icon hover" aria-hidden="true"></i>';
    var user;
    var computer;
    var game;
    var choice;
    var winningSquares;
    var hoverReady = false;

    // display modal window on page load
    $(window).load(function(){
        $('#modal').modal('show');
    });

     // close modal when X or O selection is made
    $('.selection').click(function() {
        $('#modal').modal('toggle');
    });

    // display hover icon on mouse hover if square is not already populated
    $('.square').hover(function() {
        if (!hoverReady) { //hoverReady becomes true 750ms after selection is made (since computer has first move)
            return;
        }
        if ($(this).html() === x || $(this).html() === o) {
            return;
        } $(this).html(user.hoverIcon);

    }, function() { // remove icon on mouse move
        if ($(this).html() === x || $(this).html() === o) {
            return;
        } $(this).html('');
    });

    // if square isn't already populated, or the game is not over, mark with X or O when clicked and run minimax
    $('.square').click(function() {
        if ($(this).html() === x || $(this).html() === o || game.isWin(computer)) {
            return;
        } $(this).html(user.displayIcon);
        
        hoverReady = false; // temporarily turn off hover
        var square = $(this).attr('id').slice(1); // numeric ID of square
        game.move(user, square);
        var temp = game.board;
        miniMax(game);
    
        function newMove(board, otherBoard) {
            for (var i = 0; i < board.length; i++) {
                if (board[i] !== otherBoard[i]) {
                    return i;
                }
            }
        }
        setTimeout(function() {
            $('#S' + newMove(game.board, choice)).html(computer.displayIcon);
            game = new Game(choice);
            hoverReady = true;
            if (game.isWin(computer)) {
                hoverReady = false;
                win();
            }
            if (game.isDraw() && !game.isWin(computer)) {
                hoverReady = false;
                draw();
            }
        }, 250);
    });

    // construct player based on user input and create new board
    $('.selection').click(function() {
        if ($(this).attr('id') === 'selection-x') {
            user = new Player('X', x, xHover);
            computer = new Player('O', o, oHover);
        } else {
            user = new Player('O', o, oHover);
            computer = new Player('X', x, xHover);
        }
        firstMove();
    });

  // ------GAME LOGIC------
    function Player(marker, displayIcon, hoverIcon) {
        this.marker = marker;
        this.displayIcon = displayIcon;
        this.hoverIcon = hoverIcon;
    }

    // creates new Game with random first move
    function firstMove() {
        var newBoard =  ['-', '-', '-',
                         '-', '-', '-',
                         '-', '-', '-'];
        var random = Math.floor(Math.random() * 10);
        if (random === 9) {
            random = 0;
        }
        newBoard[random] = computer.marker;
        setTimeout(function() { // wait 350ms to display first computer move
            $('#S' + random).html(computer.displayIcon);
        }, 350);
        setTimeout(function() { // turn on hover after 500ms
            hoverReady = true;
        }, 500);
        game = new Game(newBoard);
    }
    
    // Game constructor; each instance of Game represents a game board.
    function Game(board) {
        this.board = board;
        this.move = function(player, square) {
            this.board[square] = player.marker;
        };
        
        // returns a multidimensional array of all possible moves, or false if none exist
        this.generateMoves = function(player) {
            var possibleMoves = [];
            for (var i = 0; i < board.length; i++) {
                if (board[i] === '-') {
                    board[i] = player.marker;
                    possibleMoves.push(board.slice(0));
                    board[i] = '-';
                }
            }
            if (possibleMoves.length === 0) {
                return false;
            }
            return possibleMoves;
        };
        
        // returns true if the the board is in a winning state in favor of the passed player arg
        this.isWin = function(player) {
            var markerPositions = [];
            for (var i = 0; i < board.length; i++) {
                if (board[i] === player.marker) {
                    markerPositions.push(i);
                }
            }
            var winningStates = [[0, 1, 2], [3, 4, 5], [6, 7, 8],
                                 [0, 3, 6], [1, 4, 7], [2, 5, 8],
                                 [0, 4, 8], [6, 4, 2]];
            for (var i = 0; i < winningStates.length; i++) {
                var count = 0;
                for (var j = 0; j < winningStates[i].length; j++) {
                    if (markerPositions.indexOf(winningStates[i][j]) !== -1) {
                        count++;
                    }
                }
                if (count === 3) {
                    winningSquares = winningStates[i];
                    return true;
                }
            }
            return false;
        };
        
        // returns true if the computer or player has won, or if there are no available moves
        this.gameOver = function() {
             return this.isWin(computer) || this.isWin(user) || this.board.indexOf('-') === -1;
        };

        // returns true if there are no avilable moves;
        this.isDraw = function() {
            var count = 0;
            for (var i = 0; i < board.length; i++) {
                if (board[i] === 'X' || board[i] === 'O') {
                    count++;
                }
            }
            return count === 9;
        };

        // scoring function that helps the minimax algorithm find the best move
        this.score = function() {
            if (this.isWin(computer)) {
                return 1;
            } else if (this.isWin(user)) {
                return -1;
            } else {
                return 0;
            }
        };
    }

    var active = 'user';

    // helper function to switch active turn
    var switchTurn = function() {
       if (active === 'computer') {
            active = 'user';
        } else if (active === 'user') {
            active = 'computer';
        }
    };

    // helper function to find index of highest element
    Array.prototype.highest = function() {
        var greatest = -100;
        var greatestIndex;
        for (var i = 0; i < this.length; i++) {
            if (this[i] > greatest) {
                greatest = this[i];
                greatestIndex = i;
            }
        }
        return greatestIndex;
    };

    // helper function to find index of lowest element
    Array.prototype.lowest = function() {
        var lowest = 100;
        var lowestIndex;
        for (var i = 0; i < this.length; i++) {
            if (this[i] < lowest) {
                lowest = this[i];
                lowestIndex = i;
            }
        }
        return lowestIndex;
    };

    // recursive function to determine best move
    function miniMax(game) {
        switchTurn();
        if (game.gameOver()) {
            switchTurn();
            return game.score();
        }
        else {
            if (active === 'computer') {
                var moves = game.generateMoves(computer);
                var scores = [];
                for (var i = 0; i < moves.length; i++) {
                    var move = new Game(moves[i]);
                    scores.push(miniMax(move));
                }
                choice = moves[scores.highest()];
                switchTurn();
                return scores[scores.highest()];
            }
            if (active === 'user') {
                var moves = game.generateMoves(user);
                var scores = [];
                for (var i = 0; i < moves.length; i++) {
                    var move = new Game(moves[i]);
                    scores.push(miniMax(move));
                }
                choice = moves[scores.lowest()];
                switchTurn();
                return scores[scores.lowest()];
            }
        }
    }

  // -------ANIMATION------
  
  // on win, flash winning squares, then reload page
    function win() {
        setTimeout(function() {
            displayOn();
            setTimeout(function() {
                displayOff();
                setTimeout(function() {
                    displayOn();
                    setTimeout(function() {
                        displayOff();
                        setTimeout(function() {
                            displayOn();
                     }, 350);
                }, 350);
            }, 350);
        }, 350);
    }, 50);
      
    function displayOff() {
        $('#S' + winningSquares[0]).html('');
        $('#S' + winningSquares[1]).html('');
        $('#S' + winningSquares[2]).html('');
    }
    function displayOn() {
        $('#S' + winningSquares[0]).html(computer.displayIcon);
        $('#S' + winningSquares[1]).html(computer.displayIcon);
        $('#S' + winningSquares[2]).html(computer.displayIcon);
    }
    // reload page so user can play again
    setTimeout(function() {
            location.reload();
        }, 2100);
    }

    // on a draw, flash all squares, then reload page
    function draw() {
        setTimeout(function() {
            flashOn();
            setTimeout(function() {
                flashOff();
                setTimeout(function() {
                    flashOn();
                    setTimeout(function() {
                        flashOff();
                        setTimeout(function() {
                            flashOn();
                    }, 350);
                }, 350);
            }, 350);
        }, 350);
    }, 50);

    function flashOff() {
        for (var i = 0; i < 9; i++) {
            $('#S' + i).html('');
        }
    }
    function flashOn() {
        for (var i = 0; i < 9; i++) {
            if (game.board[i] === 'X') {
                $('#S' + i).html(x);
            } else {
                $('#S' + i).html(o);
            }
        }
    }
    // reload page so user can play again
    setTimeout(function() {
            location.reload();
        }, 2100);
    }
});