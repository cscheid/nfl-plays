var all_plays;

$().ready(function() {

    $("#help").click(function() {
        $("#help").hide();
    });

    var canvas = document.getElementById("webgl");
    var width = window.innerWidth, height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    interactor = Facet.UI.center_zoom_interactor({
        width: width, height: height, zoom: 2/3
    });

    var interactor = Facet.UI.center_zoom_interactor({
        width: width,
        height: height,
        center: vec.make([50,10]),
        zoom: 0.03,
        widest_zoom: 0.03
    });
    var gl = Facet.init(canvas, {
        clearColor: [1,1,1,1],
        interactor: interactor
    });
    Facet.Net.json("data/sorted_plays.json", function(full_data) {
        var pointsize = Shade.parameter("float", 0);
        var pointweight = Shade.parameter("float", 0);
        Facet.UI.parameter_slider({ element: "#pointsize",   parameter: pointsize,   min: -3, max: 3 });
        Facet.UI.parameter_slider({ element: "#pointweight", parameter: pointweight, min: -3, max: 3 });

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
                Facet.Scene.add(Facet.Text.string_batch({
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

        var parameters_by_kind =
            [ 
                { selected_color: Shade.color("#ff0000", 0.2),  unselected_color: Shade.vec(0,0,0,0.02), diameter: 2},
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
            27518, 28136, 
            228916, 388123, 417060, 
            430445, 441392, 454554, 
            454709, 458821, 469785,
            470754, 471008, 471134
        ], function(line, i) {
            var result = full_data.slice(prev * 7, line * 7);
            prev = line;
            var data = new Float32Array(result);
            var secs = Facet.attribute_buffer({
                vertex_array: data,
                item_size: 1,
                stride: 28,
                offset: 0
            });
            var ydline = Facet.attribute_buffer({
                vertex_array: data,
                item_size: 1,
                stride: 28,
                offset: 12
            });
            var kind = Shade(i);
            // var column6 = Facet.attribute_buffer({
            //     vertex_array: data,
            //     item_size: 1,
            //     stride: 28,
            //     offset: 24
            // });
            
            var pt = Shade.vec(
                Shade(3600).sub(secs).div(3600).mul(100),
                Shade(100).sub(ydline).div(100).mul(20)
            );

            var unselected_color = Shade.parameter("vec4", Shade.vec(0,0,0,0.05));
            var selected_color = Shade.parameter("vec4", Shade.color("#1f77b4", 0.2));
            var selection_enabled = Shade.parameter("float", 0);

            // var sel_kind   = Shade.parameter("float", 0);
            // function make_kind_selection(attrs) {
            //     return function() {
            //         diameter_multiplier.set(attrs.diameter);
            //         selected_color.set(attrs.selected_color);
            //         unselected_color.set(attrs.unselected_color);
            //         sel_kind.set(attrs.kind);
            //         selection_enabled.set(1);
            //         Facet.Scene.invalidate();
            //     };
            // }

            // function remove_selection() {
            //     selection_enabled.set(0);
            //     Facet.Scene.invalidate();
            // }

            // var hover_out_function = remove_selection;
            // var previous_selection;

            // function fix_selection(fun) {
            //     return function(evt) {
            //         if (previous_selection) {
            //             $(previous_selection).removeClass("selected");
            //             previous_selection = undefined;
            //         }
            //         if (hover_out_function !== fun) {
            //             $(evt.target).addClass("selected");
            //             hover_out_function = fun;
            //             previous_selection = evt.target;
            //         } else
            //             hover_out_function = remove_selection;
            //     };
            // }

            // var diameter_multiplier = Shade.parameter("float", 2);
            // var selected_field_goal_color = Shade.color("#1f77b4", 0.2);

            // _.each(,
            //        function(attrs) {
            //            var selection = make_kind_selection(attrs);
            //            $("#kind-" + attrs.kind)
            //                .hover(selection, function() { hover_out_function(); })
            //                .click(fix_selection(selection));
            //        });

            // var is_selected = selection_enabled.eq(1).and(sel_kind.eq(kind));

            // var final_color = Shade.ifelse(selection_enabled.eq(0), Shade.vec(0,0,0,0.1),
            //                                Shade.ifelse(sel_kind.eq(kind), selected_color, unselected_color));

            var final_color = parameters_by_kind[i].selected_color;

            var base_diameter = interactor.zoom.mul(100).pow(0.666).mul(pointsize.exp());
            var multiplier = parameters_by_kind[i].diameter; // Shade.ifelse(is_selected, diameter_multiplier, 1);
            var final_diameter = base_diameter.mul(multiplier);

            return {
                kind: i,
                dots: Facet.Marks.dots({
                    position: interactor.camera(pt),
                    fill_color: final_color.mul(Shade.vec(1,1,1,pointweight.exp())),
                    stroke_width: -1,
                    point_diameter: final_diameter,
                    elements: data.length/7
                })
            };
        });
        function find(collection, filter) {
            for (var i = 0; i < filter.length; i++) {
                if (filter(collection[i], i, collection)) return i;
            }
            return -1;
        }
        all_plays = {
            draw: function() {
                _.each(plays_by_kind, function(play) {
                    play.dots.draw();
                });
            },
            select: function(kind) {
                var i = find(plays_by_kind, function(play) { return play.kind === kind; });
                if (i === -1) throw "booo";
                var this_play = plays_by_kind[i];
                plays_by_kind.splice(i, 1);
                plays_by_kind.push(this_play);
                Facet.Scene.invalidate();
            }
        };
        Facet.Scene.add(all_plays);
    });
});
