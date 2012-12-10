$(document).ready(function() {
	var canvas = $("#gameboard");
	var context = canvas[0].getContext("2d");
	var width = 368;
	var height = 368;
	var cellWidth = 16;
	var cellHeight = 16;
	
	canvas.attr("width", width);
	canvas.attr("height", height);
	
	var mouseImage = new Image();
	mouseImage.src = "img/mouse.png";
	var blockImage = new Image();
	blockImage.src = "img/block.png";
	var bushImage = new Image();
	bushImage.src = "img/bush.png";
	var catImage = new Image();
	catImage.src = "img/cat.png";
	var catTrappedImage = new Image();
	catTrappedImage.src = "img/catTrapped.png";
	var cheeseImage = new Image();
	cheeseImage.src = "img/cheese.png";
	
	var map;
	var mouse;
	var cats;
	var cheeses;
	var mouseLives;
	var score;

	function init() {
	    map = MapLibrary.Map1();
	    mouse = { x: 11, y: 11 };
	    mouseLives = 3;
	    cats = [];
	    createCats(1);
	    cheeses = [];
	    score = 0;
	    main();
	}
	init();

	function main() {
	    paint();
	    if (typeof paintLoop != "undefined") clearInterval(paintLoop);
	    paintLoop = setInterval(paint, 50);

	    mainGameLoop();
	    if (typeof gameLoop != "undefined") clearInterval(gameLoop);
	    gameLoop = setInterval(mainGameLoop, 1000);
	}

	function gameOver() {
	    if (typeof paintLoop != "undefined") clearInterval(paintLoop);
	    if (typeof gameLoop != "undefined") clearInterval(gameLoop);
	    paint();
	    context.fillStyle = '#000000';
	    context.font = 'bold 30px sans-serif';
	    context.textAlign = 'center';
	    context.fillText('Game Over!', width / 2, height / 2 - 15);
	    context.fillText('Press Enter to play again.', width / 2, height / 2 + 15);
	}

	function mainGameLoop() {

	    clearDebug();
	    stdDebug();

	    for (var i = 0; i < cats.length; i++) {
	        moveCat(cats[i]);
	        if (cats[i].x == mouse.x && cats[i].y == mouse.y) {
	            killMouse();   
	        }
	    }
	    if (allCatsTrapped()) {
	        for (var i = 0; i < cats.length; i++) {
	            cheeses.push({ x: cats[i].x, y: cats[i].y });
	        }
	        cats = [];
	        createCats(score / 50 + 1);
	    }
	}

	function allCatsTrapped() {
	    for (var i = 0; i < cats.length; i++) {
	        if (!cats[i].trapped) return false;
	    }
	    return true;
	}

	function killMouse() {
	    mouse.x = 11;
	    mouse.y = 11;
	    mouseLives--;
	    if (mouseLives > 0)
	        main();
	    else
	        gameOver();
	}

	function moveCat(c) {

	    var mapArray = new Array(23);
	    for (var i = 0; i < mapArray.length; i++) {
	        var mapArrayRow = new Array(23);
	        for (var j = 0; j < mapArrayRow.length; j++) {
	            if (i == 0 || i == 22 || j == 0 || j == 22)
	                mapArrayRow[j] = 1;
	            else
	                mapArrayRow[j] = 0;
	        }
	        mapArray[i] = mapArrayRow;
	    }

	    mapArray[mouse.x][mouse.y] = 0;
	    for (var i = 0; i < cats.length; i++) { mapArray[cats[i].x][cats[i].y] = 1; }
	    for (var i = 0; i < map.bushes.length; i++) { mapArray[map.bushes[i].x][map.bushes[i].y] = 1; }
	    for (var i = 0; i < map.blocks.length; i++) { mapArray[map.blocks[i].x][map.blocks[i].y] = 1; }
	    for (var i = 0; i < cheeses.length; i++) { mapArray[cheeses[i].x][cheeses[i].y] = 1; }

	    var graph = new Graph(mapArray);
	    var start = graph.nodes[c.x][c.y];
	    start.type = 0;
	    var end = graph.nodes[mouse.x][mouse.y];
	    start.type = 0;
	    var path = astar.search(graph.nodes, start, end);

	    if (path.length > 0) {
	        c.x = path[0].x;
	        c.y = path[0].y;
	        c.trapped = false;
	    } else {
            var moves = [
                { dx: -1, dy: -1 },
                { dx: -1, dy: 0 },
                { dx: -1, dy: 1 },
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 },
                { dx: 1, dy: -1 },
                { dx: 1, dy: 0 },
                { dx: 1, dy: 1 }
            ];

	        for (var i = 0; i < moves.length; i++) {
	            newX = c.x + moves[i].dx;
	            newY = c.y + moves[i].dy;
	            moves[i].distance = Math.sqrt(Math.pow(newX - mouse.x, 2) + Math.pow(newY - mouse.y, 2));
	        }

	        sortedMoves = _.sortBy(moves, function (move) { return move.distance });
	        validMoves = _.filter(sortedMoves, function (move) {
	            return !block(c.x + move.dx, c.y + move.dy)
                && !cat(c.x + move.dx, c.y + move.dy)
                && !bush(c.x + move.dx, c.y + move.dy)
                && c.x + move.dx > 0
                && c.x + move.dx < (width / cellWidth) - 1
                && c.y + move.dy > 0
                && c.y + move.dy < (height / cellHeight) - 1;
	        });

	        if (validMoves.length > 0) {
	            c.x += validMoves[0].dx;
	            c.y += validMoves[0].dy;
	            c.trapped = false;
	        } else {
	            c.trapped = true;
	        }
	    }
	}

	
	function paint() {
		context.fillStyle = "#808000";
		context.fillRect(0, 0, width, height);
		paintBorder();
		paintMouse();
		paintCats();
		paintBlocks();
		paintBushes();
		paintCheeses();
	}
	
	function paintBorder() {
		for (var i = 0; i < width / cellWidth; i++) {
			context.drawImage(blockImage, i * cellWidth, 0, cellWidth, cellHeight);
			context.drawImage(blockImage, i * cellWidth, 22 * cellHeight, cellWidth, cellHeight);
		}
		for (var i = 1; i < 22; i++) {
			context.drawImage(blockImage, 0, i * cellHeight, cellWidth, cellHeight);
			context.drawImage(blockImage, 22 * cellHeight, i * cellHeight, cellWidth, cellHeight);
		}
	}
	
	function paintMouse() {
		context.drawImage(mouseImage, mouse.x * cellWidth, mouse.y * cellHeight, cellWidth, cellHeight);
	}
	
	function paintCats() {
	    for (var i = 0; i < cats.length; i++) {
	        if (cats[i].trapped) {
	            context.drawImage(catTrappedImage, cats[i].x * cellWidth, cats[i].y * cellHeight, cellWidth, cellHeight);
	        } else {
	            context.drawImage(catImage, cats[i].x * cellWidth, cats[i].y * cellHeight, cellWidth, cellHeight);
	        }
		}
	}
	
	function paintBlocks() {
		for (var i = 0; i < map.blocks.length; i++) {
			context.drawImage(blockImage, map.blocks[i].x * cellWidth, map.blocks[i].y * cellHeight, cellWidth, cellHeight);
		}
	}
	
	function paintBushes() {
		for (var i = 0; i < map.bushes.length; i++) {
			context.drawImage(bushImage, map.bushes[i].x * cellWidth, map.bushes[i].y * cellHeight, cellWidth, cellHeight);
		}
	}

	function paintCheeses() {
	    for (var i = 0; i < cheeses.length; i++) {
	        context.drawImage(cheeseImage, cheeses[i].x * cellWidth, cheeses[i].y * cellHeight, cellWidth, cellHeight);
	    }
	}
	
	// Returns true if there is a block at the position (x, y)
	function block(x, y) {
		for (var i = 0; i < map.blocks.length; i++) {
			if (map.blocks[i].x == x && map.blocks[i].y == y) return true;
		}
		return false;
	}
	
	// Returns true if there is a cat at the position (x, y)
	function cat(x, y) {
		for (var i = 0; i < cats.length; i++) {
			if (cats[i].x == x && cats[i].y == y) return true;
		}
		return false;
	}
	
	// Returns true if there is a bush at the position (x, y)
	function bush(x, y) {
		for (var i = 0; i < map.bushes.length; i++) {
			if (map.bushes[i].x == x && map.bushes[i].y == y) return true;
		}
		return false;
	}
	
	// Add num number of cats to the list of map's cats
	function createCats(num) {
	    for (var i = 0; i < num; i++) {
	        do {
	            catX = 1 + Math.floor(Math.random() * ((width - 2 * cellWidth) / cellWidth));
	            catY = 1 + Math.floor(Math.random() * ((width - 2 * cellHeight) / cellHeight));
	        } while (block(catX, catY) || cat(catX, catY) || bush(catX, catY) || (catX == mouse.x && catY == mouse.y));
	        cats.push({ x: catX, y: catY, trapped: false });
	    }
	}

	function getCat(x, y) {
	    for (var i = 0; i < cats.length; i++) {
	        if (cats[i].x == x && cats[i].y == y) return cats[i];
	    }
	    return null;
	}

	function clearDebug() {
        $("#debug").text("");
	}

	function stdDebug() {	   
	    $("<p>").text("Lives : " + mouseLives).appendTo($("#debug"));
	    $("<p>").text("Score : " + score).appendTo($("#debug"));
	    $("<p>").text("Cats : " + cats.length).appendTo($("#debug"));
	}

	function debugOther(info) {
	    $("<p>").text(info).appendTo($("#debug"));
	}

	// Method that moves bushes when the mouse tries to move onto them
	// This method is recursive to allow pushing of a line of bushes
	// Returns true if:
	//		1. There is not a bush at the position (x, y)
	//		2. There is a bush at the position (x, y) but 
	//		it can be moved in the direction dir
	// Post-condition: bush at (x, y) is moved in the direction dir
	function moveBushes(x, y, dir) {
		for (var i = 0; i < map.bushes.length; i++) {
			if (map.bushes[i].x == x && map.bushes[i].y == y) {				
				if (dir == "left") {
				    if (moveBushes(x - 1, y, "left") && !block(x - 1, y) && x > 1) {
				        if (cat(x - 1, y)) {
				            if (!getCat(x - 1, y).trapped) {
				                moveCat(getCat(x - 1, y));
				                map.bushes[i].x--;
				            } else return false;
				        } else map.bushes[i].x--;
				        for (var j = 0; j < cheeses.length; j++) {
				            if (cheeses[j].x == map.bushes[i].x && cheeses[j].y == map.bushes[i].y) {
				                cheeses.splice(j, 1);
				            }
				        }
					} else return false;
				} else if (dir == "up") {
				    if (moveBushes(x, y - 1, "up") && !block(x, y - 1) && y > 1) {
				        if (cat(x, y - 1)) {
				            if (!getCat(x, y - 1).trapped) {
				                moveCat(getCat(x, y - 1));
				                map.bushes[i].y--;
				            } else return false;
				        } else map.bushes[i].y--;
				        for (var j = 0; j < cheeses.length; j++) {
				            if (cheeses[j].x == map.bushes[i].x && cheeses[j].y == map.bushes[i].y) {
				                cheeses.splice(j, 1);
				            }
				        }
					} else return false;
				} else if (dir == "right") {
				    if (moveBushes(x + 1, y, "right") && !block(x + 1, y) && x < (width / cellWidth) - 2) {
				        if (cat(x + 1, y)) {
				            if (!getCat(x + 1, y).trapped) {
				                moveCat(getCat(x + 1, y));
				                map.bushes[i].x++;
				            } else return false;
				        } else map.bushes[i].x++;
				        for (var j = 0; j < cheeses.length; j++) {
				            if (cheeses[j].x == map.bushes[i].x && cheeses[j].y == map.bushes[i].y) {
				                cheeses.splice(j, 1);
				            }
				        }
					} else return false;
				} else if (dir == "down") {
				    if (moveBushes(x, y + 1, "down") && !block(x, y + 1) && y < (width / cellWidth) - 2) {
				        if (cat(x, y + 1)) {
				            if (!getCat(x , y + 1).trapped) {
				                moveCat(getCat(x, y + 1));
				                map.bushes[i].y++;
				            } else return false;
				        } else map.bushes[i].y++;
				        for (var j = 0; j < cheeses.length; j++) {
				            if (cheeses[j].x == map.bushes[i].x && cheeses[j].y == map.bushes[i].y) {
				                cheeses.splice(j, 1);
				            }
				        }
					} else return false;
				}
			}
		}
		return true;
	}
	
	$(document).keydown(function(e){
		var key = e.which;
		if (key == "37" && mouse.x - 1 > 0) {
		    if (!block(mouse.x - 1, mouse.y) && moveBushes(mouse.x - 1, mouse.y, "left")) {                
		        mouse.x--;
		    }
		} else if (key == "38" && mouse.y - 1 > 0) {
		    if (!block(mouse.x, mouse.y - 1) && moveBushes(mouse.x, mouse.y - 1, "up")) {
		        mouse.y--;
		    }
		} else if (key == "39" && mouse.x + 1 < (width / cellWidth) - 1) {
		    if (!block(mouse.x + 1, mouse.y) && moveBushes(mouse.x + 1, mouse.y, "right")) {
		        mouse.x++;
		    }
		} else if (key == "40" && mouse.y + 1< (width / cellWidth) - 1) {
		    if (!block(mouse.x, mouse.y + 1) && moveBushes(mouse.x, mouse.y + 1, "down")) {
		        mouse.y++;
		    }
		} else if (key == "13" && mouseLives == 0) {
		    init(); //Restart Game
		}

		for (var i = 0; i < cats.length; i++) {
		    if (cats[i].x == mouse.x && cats[i].y == mouse.y) {
		        killMouse();
		    }
		}

		for (var i = 0; i < cheeses.length; i++) {
		    if (cheeses[i].x == mouse.x && cheeses[i].y == mouse.y) {
		        cheeses.splice(i, 1);
		        score += 50;
		    }
		}

	})
	
});