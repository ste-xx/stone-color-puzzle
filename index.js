
async function documentIsReady() {
    return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', () => {
            resolve();
        }, false);
    });
};


function setField(stones, cfg = { withColor: true, withIndex: false }) {

    var uiStones = document.querySelectorAll('.stone');

    stones.forEach((stone, i) => {

        transform = []

        transform.push((e) => {
            delete e.uiElement.style.backgroundColor;
            e.uiElement.textContent = "\u00a0";
        });

        if (cfg.withColor) {
            transform.push((e) => e.uiElement.style.backgroundColor = indexToColor[stone[e.position]]);
        }

        if (cfg.withIndex) {
            transform.push((e) => e.uiElement.textContent = stone[e.position]);
        }

        transform.forEach(t => (['top', 'left', 'right', 'bottom'].map((position) => {
            return {
                uiElement: uiStones[i].querySelector(`.${position}`),
                position: position
            }
        }).forEach(t)));

    });
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

let rotateTries = 0;
let shiftTries = 0;
function globalReset(origStones, result) {

    if (rotateTries < 4) {
        rotateTries++;
        origStones[0] = rotateRight(origStones[0]);
        console.log("rotate");
        //                setTimeout(()=>solve(origStones),1000);
        return solve(origStones);
    }
    rotateTries = 0;

    if (shiftTries < 15) {
        shiftTries++;
        origStones.push(origStones.shift());
        console.log(`shift ${shiftTries}`);

        //              setTimeout(()=>solve(origStones),1000);
        return solve(origStones);
    }
    console.log("No global reset possible")
    return result;
}

async function render(result) {
    return new Promise(resolve => {
        setTimeout(() => { setField(result, cfg); resolve(); }, 1);
    });
}

async function solve(stones) {
    let origStones = JSON.parse(JSON.stringify(stones));

    var result = [];
    result.push(stones.splice(0, 1)[0]);
    let tracking = [];

    tracking.push({
        original: result[0],
        transformed: result[0],
        possible: [result[0]],
        current: 0
    });


    for (let i = 1; i < 16; i++) {
        await render(result);
        
        if (i % 4 === 0) {
            let possibleFirstStonesInRow = findMatching(result[i - 4], "bottom", stones);
            if (possibleFirstStonesInRow.length === 0) {
                console.log(`backtrack on stone ${i}.`);
                console.log(tracking[(i - 1)]);

                let snapShotResult = JSON.parse(JSON.stringify(result));
                let y = 0;
                for (let x = i - 1; x >= 0; x--) {
                    let currentTracking = tracking.pop();
                    if (currentTracking.current < currentTracking.possible.length - 1) {
                        tracking.push(currentTracking);
                    }
                    currentTracking.current++;
                    stones.push(result.pop());
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
                if (y === i) {
                    return globalReset(origStones, snapShotResult);
                } else {
                    i -= y + 1;
                    continue;
                }
                return snapShotResult
            }
            console.log(`possible stones for 4: ${possibleFirstStonesInRow.length}`)
            stones.splice(stones.indexOf(possibleFirstStonesInRow[0].original), 1);
            result.push(possibleFirstStonesInRow[0].transformed);


            if (tracking[i] !== undefined) {
                let inc = tracking[i].current
                tracking[i] = {
                    original: possibleFirstStonesInRow[0].original,
                    transformed: possibleFirstStonesInRow[0].transformed,
                    possible: possibleFirstStonesInRow,
                    current: inc
                };
            } else {
                tracking.push({
                    original: possibleFirstStonesInRow[0].original,
                    transformed: possibleFirstStonesInRow[0].transformed,
                    possible: possibleFirstStonesInRow,
                    current: 0
                });
            }
            continue;
        }

        if (i < 4) {
            let possibleFirstRowStones = findMatching(result[i - 1], "right", stones);
            if (possibleFirstRowStones.length === 0) {
                console.log(`backtrack on stone ${i}.`);
                console.log(tracking.length);
                console.log(tracking);
                return result
            }
            console.log(`possible stones for ${i}: ${possibleFirstRowStones.length}`)
            stones.splice(stones.indexOf(possibleFirstRowStones[0].original), 1);
            result.push(possibleFirstRowStones[0].transformed);

            if (tracking[i] !== undefined) {
                let inc = tracking[i].current
                tracking[i] = {
                    original: possibleFirstRowStones[0].original,
                    transformed: possibleFirstRowStones[0].transformed,
                    possible: possibleFirstRowStones,
                    current: inc
                };
            } else {
                tracking.push({
                    original: possibleFirstRowStones[0].original,
                    transformed: possibleFirstRowStones[0].transformed,
                    possible: possibleFirstRowStones,
                    current: 0
                });
            }
            continue;
        }

        let possibleStones = findMatching(result[i - 1], "right", findMatching(result[i - 4], "bottom", stones).map(e => e.original))
            .filter(e => e.transformed.top === result[i - 4].bottom)
        // debugger;
        if (possibleStones.length === 0) {
            console.log(`b&l backtrack on stone ${i}.`);
            console.log(tracking[(i - 1)]);

            let snapShotResult = JSON.parse(JSON.stringify(result));

            let y = 0;
            for (let x = i - 1; x >= 0; x--) {
                let currentTracking = tracking.pop();
                if (currentTracking.current < currentTracking.possible.length - 1) {
                    tracking.push(currentTracking);
                }
                currentTracking.current++;
                stones.push(result.pop());
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
            if (y === i) {
                return globalReset(origStones, snapShotResult);
            } else {
                i -= y + 1;
                continue;
            }
            return snapShotResult
        }
        stones.splice(stones.indexOf(possibleStones[0].original), 1);
        result.push(possibleStones[0].transformed);

        if (tracking[i] !== undefined) {
            let inc = tracking[i].current
            tracking[i] = {
                original: possibleStones[0].original,
                transformed: possibleStones[0].transformed,
                possible: possibleStones,
                current: inc
            };
        } else {
            tracking.push({
                original: possibleStones[0].original,
                transformed: possibleStones[0].transformed,
                possible: possibleStones,
                current: 0
            });
        }

    }

    await render(result);
    
    console.log(result);

    console.log(stones);
    return result;
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
    withColor: false,
    withIndex: false
};

(async () => {
    await documentIsReady();
    document.querySelectorAll('.stone').forEach((e, i) => e.id = `stone-${i}`);

    setField(givenStones, cfg);
    cfg.withColor = true;

    document.querySelector('#onlycolor').addEventListener('click', () => {
        cfg.withIndex = false;
        setField(givenStones, cfg);
    });

    document.querySelector('#withIdx').addEventListener('click', () => {
        cfg.withIndex = true;
        setField(givenStones, cfg);
    });


    document.querySelectorAll('.stone').forEach((stone) => {
        stone.addEventListener('click', (e) => {
            var idx = parseInt(event.target.id.replace('stone-', ''), 10);
            givenStones[idx] = rotateRight(givenStones[idx]);
            setField(givenStones, cfg);
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
        let result = await solve(JSON.parse(JSON.stringify(shuffle(givenStones))));
        setField(result, {
            withColor: true,
            withIndex: true
        });

      //  var res = validate(result);
        if (res.state === -1) {
            alert(res.err);
        } else {
//            alert("Geschaft!");
        }
    });
})();