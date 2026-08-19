// level definitiions

// ------------------------------------
// TRACE
// Level Data
// ------------------------------------

const levels = [
    {
    id: "1-01",
    title: "Getting Started",
    size: 9,
    start: [0, 0],
    goal: [8, 8],
    walls: []
},

    {
        id: "1-02",
        title: "A New Route",
        size: 5,
        start: [4, 0],
        goal: [0, 4],
        walls: [
            [2, 2]
        ],
        
    },
{
    id: "1-03",
    title: "Around the Wall",
    size: 5,
    start: [0, 0],
    goal: [4, 4],
    walls: [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
        [3, 3]
    ]
},
{
    id: "1-04",
    title: "The Detour",
    size: 5,
    start: [4, 0],
    goal: [0, 4],
    walls: [
        [1, 1],
        [1, 2],
        [2, 2],
        [3, 2],
        [3, 3]
    ]
},

{
    id: "1-05",
    title: "Think Ahead",
    size: 5,
    start: [0, 0],
    goal: [4, 4],
 walls: [
    [0, 2],
    [1, 2],
    [2, 0],
    [2, 2],
    [2, 4],
    [3, 4]
]
}

    


];