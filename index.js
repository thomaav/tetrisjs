function random_property(obj)
{
    let keys = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
}

let tetris_shapes = {
    I: { shape: [[0, 0, 0, 0],
                 [1, 1, 1, 1],
                 [0, 0, 0, 0],
                 [0, 0, 0, 0]],
         color: "rgb(0, 255, 255)" },

    J: { shape: [[1, 0, 0],
                 [1, 1, 1],
                 [0, 0, 0],
                 [0, 0, 0]],
         color: "rgb(0, 0, 255)" },

    L: { shape: [[0, 0, 1],
                 [1, 1, 1],
                 [0, 0, 0]],
         color: "rgb(255, 172, 0)" },

    O: { shape: [[0, 1, 1, 0],
                 [0, 1, 1, 0],
                 [0, 0, 0, 0]],
         color: "rgb(255, 255, 0)" },

    S: { shape: [[0, 1, 1],
                 [1, 1, 0],
                 [0, 0, 0]],
         color: "rgb(0, 255, 0)" },

    T: { shape: [[0, 1, 0],
                 [1, 1, 1],
                 [0, 0, 0]],
         color: "rgb(154, 0, 255)" },

    Z: { shape: [[1, 1, 0],
                 [0, 1, 1],
                 [0, 0, 0]],
         color: "rgb(255, 0, 0)" }
}

let player = {
    score: 0,
    level: 0,
    lines: 0
}

window.onload = function()
{
    $("body").keydown(
        function(evnt)
        {
            if (evnt.keyCode == 80) {
                pause = !pause;
            }

            if (pause)
                return;

            if (evnt.keyCode == 37 || evnt.keyCode == 65) {
                if (is_legal_position(current_shape.x - 1, current_shape.y, current_shape.shape)) {
                    --current_shape.x;
                }
            } else if (evnt.keyCode == 38 || evnt.keyCode == 87) {
                for (let i = 0; i < 4; ++i) {
                    current_shape.shape = rotate_shape(current_shape.shape)
                    if (is_legal_position(current_shape.x, current_shape.y, current_shape.shape)) {
                        break;
                    }
                }
            } else if (evnt.keyCode == 39 || evnt.keyCode == 68) {
                if (is_legal_position(current_shape.x + 1, current_shape.y, current_shape.shape)) {
                    ++current_shape.x;
                }
            } else if (evnt.keyCode == 40 || evnt.keyCode == 83) {
                tick();
                ticker = 0;
            } else if (evnt.keyCode == 32) {
                while(tick()) { ; }
                ticker = 0;
            } else if (evnt.keyCode == 82) {
                reinit_tetris();
                board = reset_board();
            } else if (evnt.keyCode == 16) {
                switch_shape();
            }
        });

    function tick()
    {
        // if we trickle down, just return and wait for next tick
        if (is_legal_position(current_shape.x, current_shape.y + 1, current_shape.shape)) {
            ++current_shape.y;
            return true;
        }

        // we can go nowhere, so we spawn a shape on the board
        spawn_tetris_shape(current_shape.x, current_shape.y,
                           current_shape.shape, current_shape.color);

        // do we need to delete lines?
        let lines_cleared = 0;
        for (let i = 0; i < board_height; ++i) {
            let all_occupied = 1;

            for (let j = 0; j < board_width; ++j) {
                if (!(board[i][j].occupied)) {
                    all_occupied = 0;
                }
            }

            if (all_occupied) {
                // shift all above
                shift_occupied_above_row(i);
                ++lines_cleared;
            }
        }

        // scoring (level, lines cleared, points)
        player.lines += lines_cleared;
        switch (lines_cleared) {
        case 1:
            player.score += 40;
            break;
        case 2:
            player.score += 100;
            break;
        case 3:
            player.score += 300;
            break;
        case 4:
            player.score += 1200;
            break;
        default:
            break;
        }

        if (player.lines <= 0) {
            player.level = 0;
        } else if (player.lines >= 1 && player.lines < 90) {
            player.level = Math.floor(player.lines / 10);
        } else {
            player.level = 9;
        }

        update_scoring();

        // get a new shape, and quit if new shape is not legal
        shape_queue.push(new_shape());
        current_shape = shape_queue.shift();
        if (!is_legal_position(current_shape.x, current_shape.y, current_shape.shape)) {
            board = reset_board();
        }

        // did we trickle, or need a new tetris block?
        return false
    }

    // shift everything above row n down
    function shift_occupied_above_row(n)
    {
        for (let i = n; i > 0; --i) {
            board[i] = [];
            for (let j = 0; j < board_width; j++) {
                board[i][j] = board[i - 1][j];
            }
        }

        // reset upper row so it does not trickle down all the way
        board[0] = []
        for (let i = 0; i < board_width; ++i) {
            board[0].push({
                occupied: 0,
                color: "rgb(255, 255, 255)"
            });
        }
    }

    function reset_board()
    {
        new_board = [];
        for (let i = 0; i < board_height; ++i) {
            new_board.push([]);
            for (let j = 0; j < board_width; ++j) {
                new_board[i].push({
                    occupied: 0,
                    color: "rgb(255, 255, 255)"
                });
            }
        }

        return new_board;
    }

    function new_shape()
    {
        let new_shape = Object.assign({}, random_property(tetris_shapes));

        return {
            x: Math.floor(board_width / 3),
            y: 0,
            shape: new_shape.shape,
            color: new_shape.color
        };
    }

    function rotate_shape(shape)
    {
        new_shape_array = [];
        for (let i = 0; i < shape[0].length; ++i) {
            new_shape_array.push([]);
            for (let j = 0; j < shape.length; ++j) {
                new_shape_array[i].unshift(shape[j][i]);
            }
        }

        return new_shape_array;
    }

    function switch_shape()
    {
        if (typeof saved_shape === "undefined") {
            saved_shape = current_shape;
            shape_queue.push(new_shape());
            current_shape = shape_queue.shift();
        } else {
            let tmp_shape = current_shape;
            current_shape = saved_shape;
            saved_shape = tmp_shape;
        }
    }

    function draw_square_abs(x, y, rgb_color)
    {
        context.fillStyle = rgb_color;
        context.fillRect(x + rect_border, y + rect_border,
                         rect_size - rect_border*2, rect_size - rect_border*2);
    }

    function draw_square(x, y, rgb_color, preview)
    {
        let fill_color;

        if (typeof preview === "undefined") { preview = false; }

        if (!preview) {
            fill_color = rgb_color;
        } else {
            fill_color = "rgba(112, 128, 144, 0.5)";
        }

        let square_x = x * rect_size;
        let square_y = y * rect_size;

        draw_square_abs(square_x, square_y, fill_color);
    }

    function draw_tetris_shape_abs(x, y, shape, color)
    {
        for (let i = 0; i < shape.length; ++i) {
            for (let j = 0; j < shape[i].length; ++j) {
                if (shape[i][j]) {
                    draw_square_abs(x + j * rect_size, y + i * rect_size, color);
                }
            }
        }
    }

    function draw_tetris_shape(x, y, shape, color)
    {
        for (let i = 0; i < shape.length; ++i) {
            for (let j = 0; j < shape[i].length; ++j) {
                if (shape[i][j]) {
                    draw_square(x + j, y + i, color);
                }
            }
        }
    }

    function draw_tetris_shape_pv(x, y, shape, color)
    {
        // first draw border of where the shape would land should the
        // player press space
        let row = 1;
        for (;;) {
            if (!is_legal_position(current_shape.x, current_shape.y + row, current_shape.shape)) {
                for (let i = 0; i < shape.length; ++i) {
                    for (let j = 0; j < shape[i].length; ++j) {
                        if (shape[i][j]) {
                            draw_square(x + j, y + (row - 1) + i, color, true);
                        }
                    }
                }
                break;
            }
            ++row;
        }

        draw_tetris_shape(x, y, shape, color);
    }

    function find_shape_edges(shape)
    {
        // find the leftmost and rightmost parts of the shape so
        // that we can find a fitting padding to center the shape
        // in the queue window better
        let leftmost_square = shape.length;
        let rightmost_square = 0;

        for (let i = 0; i < shape.length; ++i) {
            for (let j = 0; j < shape[i].length; ++j) {
                if (shape[i][j]) {
                    leftmost_square = Math.min(leftmost_square, j)
                    rightmost_square = Math.max(rightmost_square, j)
                }
            }
        }

        return {
            rightmost_square: rightmost_square,
            leftmost_square: leftmost_square
        }
    }


    function draw_queue_shape_centered(y, shape, color)
    {
        let left_border = board_width * rect_size + rect_size;
        let right_border = canvas.width;
        let full_width = right_border - left_border;

        let edges = find_shape_edges(shape);
        let rightmost_square = edges.rightmost_square;
        let leftmost_square = edges.leftmost_square;

        let shape_width = (rightmost_square - leftmost_square + 1)*rect_size;
        let padding_width = Math.floor((full_width - shape_width) / 2)
        draw_tetris_shape_abs(left_border + padding_width - leftmost_square * rect_size,
                              y, shape, color);
    }

    function draw_saved_shape()
    {
        if (typeof saved_shape === "undefined")
            return

        draw_queue_shape_centered(2*rect_size, saved_shape.shape, saved_shape.color);
    }

    function draw_shape_queue()
    {
        let left_border = board_width * rect_size + rect_size;
        let right_border = canvas.width;
        let full_width = right_border - left_border;

        for (let i = 0; i < queue_size; ++i) {
            let it_shape = shape_queue[i];
            draw_queue_shape_centered((i*5 + 8)*rect_size, it_shape.shape, it_shape.color);
        }
    }

    function draw_border()
    {
        for (let i = 0; i < board_height; ++i)
            draw_square(10, i, "rgb(255, 255, 255)");

        for (let i = 0; i < board_width + (sidebar_width / 30); ++i)
            draw_square(board_width + i, 6, "rgb(255, 255, 255)");
    }

    function draw_board()
    {
        draw_shape_queue();
        draw_border();
        draw_saved_shape();
        draw_tetris_shape_pv(current_shape.x, current_shape.y,
                          current_shape.shape, current_shape.color);

        for (let i = 0; i < board_height; ++i) {
            for (let j = 0; j < board_width; ++j) {
                if (board[i][j].occupied) {
                    draw_square(j, i, board[i][j].color);
                }
            }
        }
    }

    function is_legal_position(x, y, shape)
    {
        for (let i = 0; i < shape.length; ++i) {
            for (let j = 0; j < shape[i].length; ++j) {
                // if there is a square here in the shape and any one of:
                // * the square will be outside x,
                // * the square will be outside y,
                // * the square is already occupied
                if (shape[i][j] &&
                    (x + j >= board_width || x + j < 0 ||
                     y + i >= board_height || y + i < 0 ||
                     board[y + i][x + j].occupied)) {
                    return false;
                }
            }
        }

        return true;
    }

    function spawn_tetris_shape(x, y, shape, color)
    {
        if (is_legal_position(x, y, shape)) {
            for (let i = 0; i < shape.length; ++i) {
                for (let j = 0; j < shape[i].length; ++j) {
                    if (shape[i][j]) {
                        board[y + i][x + j].occupied = 1;
                        board[y + i][x + j].color = color;
                    }
                }
            }
            return true;
        }

        return false;
    }

    function reinit_tetris()
    {
        player.score = 0;
        player.level = 0;
        player.lines = 0;

        saved_shape = undefined;
        shape_queue = []
        for (let i = 0; i < queue_size+1; ++i)
            shape_queue.push(new_shape());
        current_shape = shape_queue.shift()
    }

    function update_scoring()
    {
        $("#level").text(player.level);
        $("#score").text(player.score);
        $("#lines").text(player.lines);
    }

    let rect_size = 30;
    let rect_border = rect_size / 20;
    let sidebar_width = 210;

    let canvas = document.getElementById("canvas");
    let context = canvas.getContext("2d");

    canvas.width = 300 + sidebar_width;
    canvas.height = 630;

    let board_height = canvas.height / rect_size;
    let board_width = (canvas.width - sidebar_width) / rect_size;

    // .fill with objects would do references without map, this is
    // pretty simple
    board = reset_board();

    let queue_size = 3;
    let shape_queue = [];
    let current_shape;
    let saved_shape;
    reinit_tetris();

    let ticker = 0;
    let pause = 0;

    setInterval(
        function()
        {
            if (pause)
                return;

            context.fillStyle = "black";
            context.fillRect(0, 0, canvas.width, canvas.height);
            draw_board();

            let difficulty = Math.floor(62 * (player.level / 10))
            if (ticker++ == 62 - difficulty) {
                ticker = 0;
                tick();
            }
        }, 16);
}
