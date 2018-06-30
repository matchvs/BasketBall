window.Game = {
    GameManager: null,
    BulletManager: null,
    DuckManger: null,
    PlayerManager: null,

    fireInterval: 1500,
    itemInterval: 8000,
    GameSeconds: 60
}

window.GameState = cc.Enum({
    None: 0,
    Pause: 1,
    Play: 2,
    Over: 3,
    End: 4
})

window.DirectState = cc.Enum({
    None: 0,
    Left: 1,
    Right: 2
})

window.GLB = {
    RANDOM_MATCH: 1,
    PROPERTY_MATCH: 2,
    COOPERATION: 1,
    COMPETITION: 2,
    MAX_PLAYER_COUNT: 2,
    PLAYER_COUNTS: [2],

    GAME_START_EVENT: "gameStart",
    GAME_OVER_EVENT: "gameOver",
    READY: "ready",
    ROUND_START: "roundStar",
    SHOOT_GUN_ITEM: "shootGunItem",
    FIRE_EVENT: "fire_event",
    FIRE_ANIM: "fire_anim",
    TOUCH_EVENT: "touch_event",
    GOAL_EVENT: "goal_event",
    DIRECTION: "direction",
    GAME_TIME: "game_time",

    channel: 'MatchVS',
    platform: 'alpha',
    gameId: 201488,
    gameVersion: 1,
    IP: "wxrank.matchvs.com",
    PORT: "3010",
    GAME_NAME: "game6",
    appKey: 'fb72bbd6f9ca4804bbb7dae12c710068',
    secret: 'fb1ad6cf74724a27a59ad83c089ad26c',

    gameTime: 60,
    speed: 750,
    speedY: 400,
    bounceDistance: 100,
    //双方距离--
    playerMinDistance: 268,

    matchType: 1,
    gameType: 2,
    userInfo: null,
    playerUserIds: [],
    isRoomOwner: false,

    syncFrame: true,
    FRAME_RATE: 10,

    NormalBulletSpeed: 1000,
    limitX: 505
}

