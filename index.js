
async function documentIsReady() {
    return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', () => {
            resolve();
        }, false);
    });
};

function getRenderFn(cfg = { withColor: true, withIndex: false }) {
    let renderFns = [];

    if (cfg.withColor) {
        renderFns.push((e) => {
            e.uiElement.style.backgroundColor = indexToColor[e.stone[e.position]];
            return e;
        });
    }

    if (cfg.withIndex) {
        renderFns.push((e) => {
            e.uiElement.textContent = e.stone[e.position];
            return e;
        });
    }
    let eraseFn = (e) => {
        delete e.uiElement.style.backgroundColor;
        e.uiElement.textContent = "\u00a0";
        return e;
    };
    renderFns.push(eraseFn);

    return renderFns.reduce((f, g) => (e) => f(g(e)));
}

function renderField(stones, cfg) {
    var uiStones = document.querySelectorAll('.stone');
    stones.map((stone, i) => ['top', 'left', 'right', 'bottom'].map((position) =>
        Object.assign({
            uiElement: uiStones[i].querySelector(`.${position}`),
            position: position,
            stone: stone
        })))
        .reduce((flat, toFlatten) => flat.concat(toFlatten))
        .forEach(getRenderFn(cfg));
}

function appendEmptyStones(stones) {
    let length = stones.length;
    for (let i = 0; i < 16 - length; i++) {
        stones.push({
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        });
    }
}

async function render(laidStones) {
    let _laidStones = laidStones.slice(0)

    appendEmptyStones(_laidStones);
    return new Promise(resolve => {
        setTimeout(() => { renderField(_laidStones, cfg); resolve(); }, 500);
    });
}

let retryState = {
    rotateFirstStoneCnt: 0,
    shiftGivenStonesCnt: 0
}

function globalRetry(orig, laid) {

    if (retryState.rotateFirstStoneCnt < 4) {
        retryState.rotateFirstStoneCnt++;
        orig[0] = rotateRight(orig[0]);
        console.log("rotate");
        return solve(orig);
    }
    retryState.rotateFirstStoneCnt = 0;

    if (retryState.shiftGivenStonesCnt < 15) {
        retryState.shiftGivenStonesCnt++;
        orig.push(orig.shift());
        console.log(`shift ${retryState.shiftGivenStonesCnt}`);
        return solve(orig);
    }
    console.log("No global reset possible")
    return laid;
}

var directionMapping = {
    "right": "->",
    "bottom": "v",
    "top": "^",
    "left": "<-"
};

var directionOpposite = {
    "right": "left",
    "bottom": "top"
}

function findMatching(stone, direction, stones) {
    console.log(`find ${stone[direction]} ${directionMapping[direction]} ${directionMapping[directionOpposite[direction]]} [?]. With given rest: `);
    console.log(stones);

    let foundedElements = stones.filter((s) => stone[direction] === s.left ||
        stone[direction] === s.top ||
        stone[direction] === s.right ||
        stone[direction] === s.bottom);


    if (foundedElements.length === 0) {
        return [];
    }

    return foundedElements.map((foundedElement) => {
        let rotatedFoundedElement = foundedElement;
        for (let i = 0; i < 4; i++) {
            if (stone[direction] === rotatedFoundedElement[directionOpposite[direction]]) {
                return {
                    original: foundedElement,
                    transformed: rotatedFoundedElement
                }
            }
            rotatedFoundedElement = rotateRight(rotatedFoundedElement);
        }
    });

    return undefined;
}

function backtrack(i, tracked, laid, rest) {
    let y = 0;
    for (let x = i - 1; x >= 0; x--) {
        let currentTracking = tracked.pop();
        if (currentTracking.current < currentTracking.possible.length - 1) {
            tracked.push(currentTracking);
        }
        currentTracking.current++;
        laid.push(rest.pop());
        y++;

        console.log("backtrack..." + y);
        //tried all in current
        if (currentTracking.possible.length <= 1 || currentTracking.current >= currentTracking.possible.length - 1) {
            currentTracking.current++;
            continue;
        } else {
            break;
        }
    }

    return {
        noPossibleBacktrackAvailable: (y === i),
        backtrackedIndex: i - (y + 1)
    }
}

async function solve(restStones) {
    //deep copy, because rotate change structure of the entries
    let origStones = JSON.parse(JSON.stringify(restStones));
    let laidStones = [restStones.splice(0, 1)[0]];
    
    let tracked = [{
        original: laidStones[0],
        transformed: laidStones[0],
        possible: [laidStones[0]],
        current: 0
    }];

    let findStoneStrategy = [{
        cond: (i) => i % 4 === 0,
        findMatching: (i, laid, rest) => findMatching(laid[i - 4], "bottom", rest)
    },
    {
        cond: (i) => i < 4,
        findMatching: (i, laid, rest) => findMatching(laid[i - 1], "right", rest)
    },
    {
        cond: (i) => i % 4 !== 0 && i >= 4,
        findMatching: (i, laid, rest) =>
            findMatching(laid[i - 1], "right", findMatching(laid[i - 4], "bottom", rest)
                .map(e => e.original))
                .filter(e => e.transformed.top === laid[i - 4].bottom)
    }];


    for (let i = 1; i < 16; i++) {
        await render(laidStones);

        let strategy = findStoneStrategy.find((e) => e.cond(i));
        let possibleStones = strategy.findMatching(i, laidStones, restStones);
        
        if (possibleStones.length === 0) {
            console.log(`backtrack on stone ${i}.`);
            console.log(tracked[(i - 1)]);
            //snapshot because backtrack manipulates laidstones and restStones inplace
            let snapshotLaidStones = laidStones.slice(0);
            let backtrackingResult = backtrack(i, tracked, restStones, laidStones);
            if (backtrackingResult.noPossibleBacktrackAvailable) {
                return globalRetry(origStones, snapshotLaidStones);
            } else {
                i = backtrackingResult.backtrackedIndex;
                continue;
            }
        }
        restStones.splice(restStones.indexOf(possibleStones[0].original), 1);
        laidStones.push(possibleStones[0].transformed);

        track = {
            original: possibleStones[0].original,
            transformed: possibleStones[0].transformed,
            possible: possibleStones,
            current: tracked[i] !== undefined ? tracked[i].current : 0
        };

        if (tracked[i] !== undefined) {
            tracked[i] = track;
        } else {
            tracked.push(track);
        }

    }

    await render(laidStones);
    return laidStones;
}


function validate(stones) {

    for (var i = 0; i < stones.length; i++) {

        var currentStone = stones[i]

        var leftStone = i !== 0 && i % 4 !== 0 ? stones[i - 1] : {};
        var rightStone = (i + 1) % 4 !== 0 ? stones[i + 1] : {};
        var topStone = i - gameSize > 0 ? stones[i - gameSize] : {};
        var bottomStone = i + gameSize < stones.length - 1 ? stones[i + gameSize] : {};

        console.log(`stone(${i}) on t: ${indexToColor[topStone.bottom]} r: ${indexToColor[rightStone.left]} b: ${indexToColor[bottomStone.top]} l: ${indexToColor[leftStone.right]}`)

        if (topStone.bottom && currentStone.top !== topStone.bottom) {
            return {
                state: -1,
                err: `Error in ${i} current top color: ${indexToColor[currentStone.top]} != ${indexToColor[topStone.bottom]}`
            }
        }

        if (rightStone.left && currentStone.right !== rightStone.left) {
            return {
                state: -1,
                err: `Error in ${i} current right color: ${indexToColor[currentStone.right]} != ${indexToColor[rightStone.left]}`
            };
        }

        if (bottomStone.top && currentStone.bottom !== bottomStone.top) {
            return {
                state: -1,
                err: `Error in ${i} current bottom color: ${indexToColor[currentStone.bottom]} != ${indexToColor[bottomStone.top]}`
            };
        }

        if (leftStone.right && currentStone.left !== leftStone.right) {

            return {
                state: -1,
                err: `Error in ${i} current left color: ${indexToColor[currentStone.left]} != ${indexToColor[leftStone.right]}`
            };
        }
    }

    return {
        state: 0
    }

}

function rotateRight(stone) {
    return {
        top: stone.left,
        left: stone.bottom,
        bottom: stone.right,
        right: stone.top
    };
}

let cfg = {
    withColor: true,
    withIndex: false
};

(async () => {
    await documentIsReady();
    document.querySelectorAll('.stone').forEach((e, i) => e.id = `stone-${i}`);

    renderField(givenStones, cfg);
    cfg.withColor = true;

    document.querySelector('#onlycolor').addEventListener('click', () => {
        cfg.withIndex = false;
        renderField(givenStones, cfg);
    });

    document.querySelector('#withIdx').addEventListener('click', () => {
        cfg.withIndex = true;
        renderField(givenStones, cfg);
    });


    document.querySelectorAll('.stone').forEach((stone) => {
        stone.addEventListener('click', (e) => {
            var idx = parseInt(event.target.id.replace('stone-', ''), 10);
            givenStones[idx] = rotateRight(givenStones[idx]);
            renderField(givenStones, cfg);
        });
    });

    document.querySelector('#validate').addEventListener('click', () => {
        var res = validate(givenStones);
        if (res.state === -1) {
            alert(res.err);
        } else {
            //   alert("Geschafft!");
        }
    });

    function shuffle(array) {
        let counter = array.length;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            let index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            let temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }

        return array;
    }

    document.querySelector('#solve').addEventListener('click', async () => {
        let laidStones = await solve(JSON.parse(JSON.stringify(givenStones)));
        render(laidStones);
    });
})();