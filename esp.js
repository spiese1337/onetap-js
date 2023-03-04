// @note: vars
const helpers = {}
var health_bar = {}
var s_name = 'Custom ESP'
const screen_size = Render.GetScreenSize()

res_health = 100
rage_bot = {
    target: 0,
    hitchance: 0,
}

// @region: custom functions
function print() {
    var text = ''
    for (var i = 0; i < arguments.length; i++) {
        text += arguments[i] + ' '
    }
    Cheat.PrintLog( text, [ 255, 255, 255, 255 ] )
}

helpers.outline_string = function( x, y, c, text, color, font, s_color ) {
    Render.String( x + 1, y + 1, c, text, s_color, font )
    Render.String( x    , y + 1, c, text, s_color, font )
    Render.String( x - 1, y + 1, c, text, s_color, font )
    Render.String( x - 1, y    , c, text, s_color, font )
    Render.String( x - 1, y - 1, c, text, s_color, font )
    Render.String( x    , y - 1, c, text, s_color, font )
    Render.String( x + 1, y    , c, text, s_color, font )
    Render.String( x + 1, y - 1, c, text, s_color, font )
    Render.String( x    , y    , c, text,   color, font )
}

helpers.shadow_string = function( x, y, c, text, color, font, s_color ) {
    Render.String( x + 1, y + 1, c, text, s_color, font )
    Render.String( x,     y,     c, text,   color, font )
}

helpers.lerp = function( a, b, percentage ) {
    return a + ( b - a ) * percentage
}

helpers.clamp = function( value, min, max ) {
    return Math.min( max, Math.max( min, value ) )
}

helpers.color_swap = function( color1, color2, weight ) {
    var weight = helpers.clamp( weight, 0, 1 )
    return [
        helpers.lerp( color1[0], color2[0], weight ), 
        helpers.lerp( color1[1], color2[1], weight ), 
        helpers.lerp( color1[2], color2[2], weight ), 
        helpers.lerp( color1[3], color2[3], weight )
    ]
}
// @endregion

// @region: menu
UI.AddSubTab( [ 'Visuals', 'SUBTAB_MGR' ], s_name )

var paths = {
    custom: [ 'Visuals', s_name, s_name ],
}

var menu = {
    off_esp: UI.AddCheckbox( paths.custom, 'Turn off cheat\'s esp' ),
    switch: UI.AddCheckbox( paths.custom, 'Enable ' + s_name ),
    box: UI.AddCheckbox( paths.custom, 'Box' ),
    box_color: UI.AddColorPicker( paths.custom, 'Box color' ),
    name: UI.AddDropdown( paths.custom, 'Name', [ 'Normal', 'Bold' ], 0 ),
    name_color: UI.AddColorPicker( paths.custom, 'Name color' ),
    health_bar: UI.AddMultiDropdown( paths.custom, 'Health bar', [ 'Enable', 'Custom color' ] ),
    health_bar_color: UI.AddColorPicker( paths.custom, 'Custom color' ),
    weapon: UI.AddCheckbox( paths.custom, 'Weapon' ),
    weapon_color: UI.AddColorPicker( paths.custom, 'Weapon color' ),
    flags: UI.AddMultiDropdown( paths.custom, 'Flags', [ 'Bomb', 'Kevlar', 'Target hitchance', 'Scoped', 'Fake latency warning', 'Lethal', 'Money', 'Fake' ] ),
}
// @endregion

// @region: handle custom esp
// @note: reset health on round start
health_bar.reset_health = function( ) {
    res_health = 100
}

rage_bot.handle = function( ){
    rage_bot.target = Ragebot.GetTarget( );
    rage_bot.hitchance = Ragebot.GetTargetHitchance( );
}

function handle_esp( ) {
    // @note: turns off cheat's ESP
    if ( UI.GetValue( menu.off_esp ) ) {
        UI.SetValue( ['Visuals', 'ESP', 'Enemy', 'Box'], 0 )
        UI.SetValue( ['Visuals', 'ESP', 'Enemy', 'Flags'], 0 )
        UI.SetValue( ['Visuals', 'ESP', 'Enemy', 'Ammo'], 0 )
        UI.SetValue( ['Visuals', 'ESP', 'Enemy', 'Weapon'], 0 )
    }
    
    if ( !UI.GetValue(menu.switch) ) return

    const fonts = {
        block: Render.GetFont( 'esp\\pixel_m.ttf', 16, false ),
        verdana: Render.GetFont( 'esp\\verdanab.ttf', 10, false ),
    }

    function flag( x, y, text, color, dormant ) {
        helpers.outline_string( x, y, 0, text.toString(), dormant ? [ 255, 255, 255, 200 ] : color, fonts.block, dormant ? [ 0, 0, 0, 145 ] : [ 0, 0, 0, 255 ] ) 
    }

    const enemies = Entity.GetEnemies( )
    if ( enemies != '' ) {
        // for ( i=0; i < 6; i++ ) {
        //     var flags_value = UI.GetValue(menu.flags)
        //     if (flags_value & (0 << i)) {
        //         print( i)
        //     }  
        // }
        for ( i=0; i < enemies.length; i++ ) {
            const enemy = enemies[i]
            if ( ( Entity.IsAlive( enemy ) ) ) {
                var colors = {
                    box: UI.GetColor( menu.box_color ),
                    name: UI.GetColor( menu.name_color ),
                    health_bar: UI.GetColor( menu.health_bar_color ),
                    weapon: UI.GetColor( menu.weapon_color ),
                }
                var is_dormant = Entity.IsDormant( enemy )
                // @region: health bars
                UI.SetValue( ['Visuals', 'ESP', 'Enemy', 'Health'], 0 )
                var position = Entity.GetRenderBox( enemy )
                var res_health = Entity.GetProp( enemy, 'CBasePlayer', 'm_iHealth' )
                var health = res_health
                var dormant_color = UI.GetColor(['Visuals', 'Extra', 'General', 'Dormant ESP'])
                var bar_pos = {
                    x: position[1] - 6,
                    y: position[2] - 1,
                    width: 4,
                    height: position[4] - position[2] + 3,
                }
                
                var health_val = {
                    height: Math.floor( ( bar_pos.height - 1 ) * ( health/100 ) ),
                    color: ( UI.GetValue(menu.health_bar) & ( 1 << 1 ) ) ? colors.health_bar : helpers.color_swap( [ 254, 50, 81, 255 ], [ 120, 225, 80, 255 ], health/100 ),
                    text_size: Render.TextSize( health.toString( ), fonts.block )
                }
                if ( UI.GetValue(menu.health_bar) & ( 1 << 0 ) ) {
                    Render.FilledRect( bar_pos.x, bar_pos.y, bar_pos.width, bar_pos.height, [ 0, 0, 0, 145 ] );
                    Render.FilledRect( bar_pos.x + 1, bar_pos.y + bar_pos.height - health_val.height, bar_pos.width - 2, health_val.height - 1, is_dormant ? dormant_color : health_val.color );
                    if ( health < 93 ) {
                        helpers.outline_string( bar_pos.x + 2, bar_pos.y + 1 + bar_pos.height - health_val.height - health_val.text_size[1] / 2, 1, health.toString( ), [ 255, 255, 255, 255 ], fonts.block,  [ 0, 0, 0, 255 ] )
                    }
                }
                // @endregion

                // @region: names
                var names = ['Visuals', 'ESP', 'Enemy', 'Name']
                UI.SetColor( names, colors.name )
                if ( UI.GetValue(menu.name) == 1 ) {
                    helpers.shadow_string( position[1] + ( (position[3] - position[1]) / 2 ), position[2] - 15, 1, Entity.GetName( enemy ), is_dormant ? [ 255, 255, 255, 200 ] : colors.name, fonts.verdana,  [ 0, 0, 0, 145] ) 
                    UI.SetValue( names, 0 )
                } else {
                    UI.SetValue( names, 1 )
                }
                // @endregion

                // @region: box
                if ( UI.GetValue(menu.box) ) {
                    var box_pos = {
                        x: position[1],
                        y: position[2],
                        width: position[3] - position[1] + 1,
                        height: position[4] - position[2] + 1,
                    }

                    Render.Rect( box_pos.x - 1, box_pos.y - 1, box_pos.width + 2, box_pos.height + 2, [ 0, 0, 0, 145 ] )
                    Render.Rect( box_pos.x + 1, box_pos.y + 1, box_pos.width - 2, box_pos.height - 2, [ 0, 0, 0, 145 ] )
                    Render.Rect( box_pos.x, box_pos.y, box_pos.width, box_pos.height, is_dormant ? dormant_color : colors.box )
                }
                // @endregion

                // @region: flags
                var flags_add = 0;
                var c4 = Entity.GetEntitiesByClassID(34)[0];
                if ( c4 ) {
                    var c4_ = Entity.GetProp( c4, 'DT_WeaponC4', 'm_hOwnerEntity' )
                }
                var flags_value = UI.GetValue(menu.flags)
                
                const vars = {
                    has_helmet: Entity.GetProp( enemy, 'CCSPlayer', 'm_bHasHelmet' ),
                    armor: Entity.GetProp( enemy, 'CCSPlayerResource', 'm_iArmor' ),
                    scoped: Entity.GetProp( enemy, 'CCSPlayer', 'm_bIsScoped' ),
                    ping: Entity.GetProp( enemy, 'CCSPlayerResource', 'm_iPing' ),
                    money: Entity.GetProp( enemy, 'CCSPlayer', 'm_iAccount' ),
                }
                if ( !is_dormant ) {
                    if (flags_value & (1 << 6)) {            
                        flag( position[3] + 5, position[2] - 3 + flags_add, '$' + vars.money, [ 107, 163, 20, 255], is_dormant )
                        flags_add += 10
                    }
                }
                
                if (flags_value & (1 << 1)) {
                    if ( vars.has_helmet ) {
                        flag( position[3] + 5, position[2] - 3 + flags_add, 'HK', [255, 255, 255, 255], is_dormant )
                        flags_add += 10
                    } else if ( vars.armor != 0 ) {
                        flag( position[3] + 5, position[2] - 3 + flags_add, 'K', [255, 255, 255, 255], is_dormant )
                        flags_add += 10
                    }
                }

                if (flags_value & (1 << 0)) {
                    if ( c4_ == enemy ) {
                        flag( position[3] + 5, position[2] - 3 + flags_add, 'C4', [255, 0, 0, 255], is_dormant )
                        flags_add += 10
                    } 
                }

                if (flags_value & (1 << 3)) {
                    if ( vars.scoped ) {
                        flag( position[3] + 5, position[2] - 3 + flags_add, 'ZOOM', [0, 160, 255, 255], is_dormant )
                        flags_add += 10
                    }
                }

                if (flags_value & (1 << 7)) {
                    if ( !Entity.IsBot( enemy ) ) {
                        flag( position[3] + 5, position[2] - 3 + flags_add, 'FAKE', [255, 255, 255, 255], is_dormant )
                        flags_add += 10
                    }
                }

                // @note: flags that won't render on dormant enemy 
                if ( !is_dormant ) {
                    if (flags_value & (1 << 4)) {
                        if ( ( vars.ping > 75 ) ) {
                            flag( position[3] + 5, position[2] - 3 + flags_add, 'PING', [ 255, 150, 150, 255], is_dormant )
                            flags_add += 10
                        }
                    }

                    if (flags_value & (1 << 5)) {
                        if ( health < 93 ) {
                            flag( position[3] + 5, position[2] - 3 + flags_add, 'LETHAL', [ 120, 225, 80, 255], is_dormant )
                            flags_add += 10
                        }
                    }
                }
                
                if (flags_value & (1 << 2)) {
                    if ( enemy == rage_bot.target ) {
                        flag( position[3] + 5, position[2] - 3 + flags_add, rage_bot.hitchance, [255, 255, 255, 255], is_dormant )
                        flags_add += 10
                    }
                }
                // @endregion

                // @region: weapons
                var active_weapon = Entity.GetName( Entity.GetWeapon( enemy ) )
                if ( UI.GetValue(menu.weapon) ) {
                    helpers.outline_string( position[1] + ( (position[3] - position[1]) / 2 ), position[4] - 1, 1, active_weapon.replace(' ', ''), is_dormant ? [ 255, 255, 255, 200 ] : colors.weapon, fonts.block,  is_dormant ? [ 0, 0, 0, 145 ] : [ 0, 0, 0, 255 ] ) 
                }
                // @endregion
            }
        }
    }
}
// @endregion

// @region: callbacks
Cheat.RegisterCallback( 'round_start', 'health_bar.reset_health' );
Cheat.RegisterCallback( 'CreateMove', 'rage_bot.handle' );
Cheat.RegisterCallback( 'Draw', 'handle_esp' );
// @endregion
