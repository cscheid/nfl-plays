var all_plays;
var play_grid = [];
var plays_csv;
var play_kind = [];

function find(collection, filter) {
    for (var i = 0; i < collection.length; i++) {
        if (filter(collection[i], i, collection)) return i;
    }
    return -1;
}

function update_play_table(lst) {
    if (!_.isUndefined(lst)) {
        d3.select("#play-list-table").selectAll("tr").remove();

        var q = d3.select("#play-list-table")
            .selectAll("tr")
            .data(_.map(lst.slice(0, 10), function(i) {
                return [plays_csv[i], play_kind[i]];
            }));
        q.enter().append("tr");
        // q.exit().remove();
        var q2 = q.selectAll("td")
            .data(function(row) {
                return _.pairs(row[0]);
            });
        q2.enter().append("td");
        q2.text(function(d) { return d[1]; });
    }
}

$().ready(function() {

    $("#help").click(function() {
        $("#help").hide();
    });

    var canvas = document.getElementById("webgl");
    var width = window.innerWidth, height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    var interactor = Facet.UI.center_zoom_interactor({
        width: width,
        height: height,
        center: vec.make([50,10]),
        zoom: 0.03,
        widest_zoom: 0.03
    });
    var gl = Facet.init(canvas, {
        clearColor: [1,1,1,1],
        interactor: interactor,
        mousedown: function(event) {
            Facet.Picker.draw_pick_scene();
            var r = Facet.Picker.pick(event.facetX, event.facetY);

            if (r !== 0) {
                // technically speaking, 0 is a valid play id, but it's buried
                // under thousands of other plays, so no harm.
                var play = plays_csv[r];
                var grid_address = (3600 - (Number(play.min) * 60 + Number(play.sec))) * 100 + Number(play.ydline);
                console.log(r, grid_address, play);
                update_play_table(play_grid[grid_address]);
            }
           
            return true;
        }
    });
   
    var pointsize = Shade.parameter("float", 0);
    var pointweight = Shade.parameter("float", 0);
    Facet.UI.parameter_slider({ element: "#pointsize",   parameter: pointsize,   min: -3, max: 3 });
    Facet.UI.parameter_slider({ element: "#pointweight", parameter: pointweight, min: -3, max: 3 });

    var time_scale = Shade.Scale.linear({ domain: [3600, 0], range: [0, 100]});
    var yard_scale = Shade.Scale.linear({ domain: [100, 0],  range: [0, 20]});

    Facet.Scene.add(Facet.Marks.lines({
        elements: 10,
        position: function(index, which) { 
            var x = Shade.ifelse(which.eq(0), 0, 100);
            return interactor.camera(Shade.vec(x, index.mul(2)));
        },
        color: function() { return Shade.vec(0,0,0,0.2); }
    }));

    Facet.Net.json("data/opensans.regular.json", function(font) {
        var pts = [
            Shade.vec(0,20.5),
            Shade.vec(25,20.5),
            Shade.vec(50,20.5),
            Shade.vec(75,20.5),
            Shade.vec(100,20.5),
            Shade.vec(-0.2,0-0.5),
            Shade.vec(-0.2,4-0.5),
            Shade.vec(-0.2,16-0.5)
        ];
        var scale = [1.5, 1.5, 1.5, 1.5, 1.5, 1, 1, 1];
        var strs = ["1Q", "2Q", "3Q", "4Q", "OT",
                    "Own goal line", "20yd", "Red zone"];
        var align = ["center", "center", "center", "center", "center",
                     "right", "right", "right"];
        for (var i=0; i<pts.length; ++i) {
            Facet.Scene.add(Facet.Text.outline({
                font: font,
                string: strs[i],
                size: scale[i],
                align: align[i],
                position: function(p) {
                    return interactor.camera(p.add(pts[i]));
                },
                color: function(p) {
                    return Shade.vec(0,0,0,1);
                }
            }));
        }
    });
               
    var outcome_colormap = Shade.Scale.ordinal({ 
        range: Shade.Colors.Brewer.category10()
    });

    var play_kinds = [
        { id: 0, caption:  "Kickoffs" },
        { id: 1, caption:  "On-side kicks" },
        { id: 4, caption:  "Punts" },
        { id: 6, caption:  "Field Goals" },
        { id: 2, caption:  "Passes" },
        { id: 3, caption:  "Rushes" },
        { id: 5, caption:  "PATs" },
        { id: 7, caption:  "Sacks" },
        { id: 8, caption:  "Two-point Attempts" },
        { id: 9, caption:  "Kneels" },
        { id: 11, caption: "Spikes" },
        { id: 10, caption: "Penalty before Snap" },
        { id: 12, caption: "Fumbled Snap Handoff" },
        { id: 13, caption: "Under Review" }
    ];

    d3.csv("data/combined.csv", function(result) {
        plays_csv = result;
    });

    d3.select("#play-kinds-div")
        .selectAll("span")
        .data(play_kinds)
        .enter()
        .append("span")
        .attr("id", function(play_kind) { return "kind-" + play_kind.id; })
        .attr("class", "over-fullscreen query-button")
        .text(function(play_kind) { return play_kind.caption; })
        .on("click", function(play_kind) {
            if (all_plays.toggle(play_kind.id)) {
                d3.select(this)
                    .attr("class", "over-fullscreen query-button selected");
            } else {
                d3.select(this)
                    .attr("class", "over-fullscreen query-button");
            };
        });

    Facet.Net.json("data/plays.json", function(full_data) {
        var n_columns = 8;
        var parameters_by_kind =
            [ 
                { selected_color: Shade.color("#1f77b4", 0.5),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
                { selected_color: Shade.color("#1f77b4", 0.5),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 3},
                { selected_color: Shade.color("#1f77b4", 0.2),  unselected_color: Shade.vec(0,0,0,0.01), diameter: 1.5},
                { selected_color: Shade.color("#1f77b4", 0.2),  unselected_color: Shade.vec(0,0,0,0.01), diameter: 1.5},
                { selected_color: Shade.color("#1f77b4", 0.3),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
                { selected_color: Shade.color("#1f77b4", 0.3),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
                { selected_color: Shade.color("#1f77b4", 0.3),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
                { selected_color: Shade.color("#1f77b4", 0.3),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
                { selected_color: Shade.color("#1f77b4", 0.7),  unselected_color: Shade.vec(0,0,0,0.01), diameter: 3},
                { selected_color: Shade.color("#1f77b4", 0.5),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
                { selected_color: Shade.color("#1f77b4", 0.5),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
                { selected_color: Shade.color("#1f77b4", 0.5),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2}, 
                { selected_color: Shade.color("#1f77b4", 0.5),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
                { selected_color: Shade.color("#1f77b4", 0.5),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2} 
            ];

        var prev = 0;
        var plays_by_kind = _.map([
	27564, 28144, 228942, 388164, 417102, 430483, 441423, 454585, 454740, 458852, 469810, 470779, 471033, 471132
        ], function(line, i) {
            var result = full_data.slice(prev * n_columns, line * n_columns);
            var id_buffer = [];
            for (var j=prev; j<line; ++j) {
                var yd      = result[(j-prev)*n_columns+3],
                    curtime = result[(j-prev)*n_columns],
                    csv_id  = result[(j-prev)*n_columns+7];
                if (_.isUndefined(play_grid[(3600 - curtime) * 100 + yd])) {
                    play_grid[(3600 - curtime) * 100 + yd] = [];
                }
                play_grid[(3600 - curtime) * 100 + yd].push(csv_id);
                play_kind[csv_id] = i;
                id_buffer.push(csv_id);
            }
            prev = line;
            var data = new Float32Array(result);
            var secs = Facet.attribute_buffer({
                vertex_array: data,
                item_size: 1,
                stride: n_columns * 4,
                offset: 0
            });
            var ydline = Facet.attribute_buffer({
                vertex_array: data,
                item_size: 1,
                stride: n_columns * 4,
                offset: 12
            });
            var outcome = Facet.attribute_buffer({
                vertex_array: data,
                item_size: 1,
                stride: n_columns * 4,
                offset: 24
            });
            var id = Facet.id_buffer(id_buffer);
            var kind = Shade(i);

            var pt = Shade.vec(time_scale(secs), yard_scale(ydline));

            var unselected_color = Shade.parameter("vec4", Shade.vec(0,0,0,0.05));
            var selected_color = parameters_by_kind[i].selected_color;

            selected_color = outcome_colormap(outcome);

            var selection_enabled = Shade.parameter("float", 0);

            var is_selected = selection_enabled.eq(1);
            var final_color = is_selected.ifelse(selected_color, Shade.vec(0,0,0,Shade.mul(0.1, pointweight.exp())));

            var base_diameter = interactor.zoom.mul(100).pow(0.666).mul(pointsize.exp());
            var multiplier = Shade.ifelse(is_selected, parameters_by_kind[i].diameter, 1);
            var final_diameter = base_diameter.mul(multiplier);

            return {
                kind: i,
                is_selected: selection_enabled,
                dots: Facet.Marks.dots({
                    position: interactor.camera(pt),
                    fill_color: final_color,
                    stroke_width: -1,
                    point_diameter: final_diameter,
                    elements: data.length/n_columns,
                    pick_id: id
                })
            };
        });
        all_plays = {
            find: function(kind) {
                var i = find(plays_by_kind, function(play) { return play.kind === kind; });
                if (i === -1) throw "booo";
                return i;
            },
            select: function(kind) {
                var i = this.find(kind);
                var this_play = plays_by_kind[i];
                plays_by_kind.splice(i, 1);
                plays_by_kind.push(this_play);
                this_play.is_selected.set(1);
                Facet.Scene.invalidate();
            },
            unselect: function(kind) {
                var this_play = plays_by_kind[this.find(kind)];
                this_play.is_selected.set(0);
                Facet.Scene.invalidate();
            },
            toggle: function(kind) {
                var this_play = plays_by_kind[this.find(kind)];
                if (this_play.is_selected.get()) {
                    this.unselect(kind);
                    return false;
                } else {
                    this.select(kind);
                    return true;
                }
            },

            //////////////////////////////////////////////////////////////////

            draw: function() {
                _.each(plays_by_kind, function(play) {
                    play.dots.draw();
                });
            }
        };
        Facet.Scene.add(all_plays);
    });
});
