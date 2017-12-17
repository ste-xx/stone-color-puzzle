var indexToColor = {
    1: "darkgreen",
    2: "orange",
    3: "yellow",
    4: "lightblue",
    5: "darkblue",
    6: "lightgreen",
}

var gameSize = 4; 

var givenStones = [

    {
        top: 1,
        left: 1,
        right: 2,
        bottom: 3
    },
    {
        top: 4,
        left: 2,
        right: 5,
        bottom: 3
    },
    {
        top: 1,
        left: 4,
        right: 6,
        bottom: 4
    },
    {
        top: 5,
        left: 1,
        right: 6,
        bottom: 2
    }, 
    //2 row
    
    {
        top: 3,
        left: 6,
        right: 3,
        bottom: 4
    }, 
    {
        top: 1,
        left: 3,
        right: 6,
        bottom: 6
    }, 
    {
        top: 1,
        left: 6,
        right: 4,
        bottom: 3
    },
     {
        top: 4,
        left: 6,
        right: 2,
        bottom: 2
    }, 
    // 3 row
    {
        top: 4,
        left: 2,
        right: 4,
        bottom: 5
    }, 
    {
        top: 4,
        left: 3,
        right: 6,
        bottom: 2
    }, 
    {
        top: 5,
        left: 3,
        right: 3,
        bottom: 5
    },
    {
        top: 2,
        left: 3,
        right: 5,
        bottom: 5
    },
    //4 row
    {
        top: 5,
        left: 2,
        right: 4,
        bottom: 1
    }, 
    {
        top: 1,
        left: 2,
        right: 6,
        bottom: 6
    }, 
    {
        top: 5,
        left: 3,
        right: 1,
        bottom: 4
    },
    {
        top: 5,
        left: 1,
        right: 4,
        bottom: 4
    }
]