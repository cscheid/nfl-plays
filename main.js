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
    Facet.Net.json("data/plays.json", function(data) {
        data = new Float32Array(data);
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

        var pt = Shade.vec(
            Shade(3600).sub(secs).div(3600).mul(100),
            Shade(100).sub(ydline).div(100).mul(20)
            );

        // var unselected_color = Shade.vec(0,0,0,0.1);
        // var selected_color = Shade.parameter("vec4", vec.make([1,0,0,0.5]));
        // var selection_enabled = Shade.parameter("float", 0);

        // var sel_completed   = Shade.parameter("float", 0);
        // var sel_intercepted = Shade.parameter("float", 0);
        // var sel_bias        = Shade.parameter("float", 0);

        // function make_selection(vec) {
        //     return function() {
        //         sel_completed.set(vec.completed);
        //         sel_intercepted.set(vec.intercepted);
        //         sel_bias.set(vec.bias * 0.9);
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
        //         if (hover_out_function !== fun) {
        //             $(evt.target).addClass("selected");
        //             hover_out_function = fun;
        //             previous_selection = evt.target;
        //         } else {
        //             $(previous_selection).removeClass("selected");
        //             previous_selection = undefined;
        //             hover_out_function = remove_selection;
        //         }
        //     };
        // }

        // var intercepted_selection = make_selection({completed:  0, intercepted: 1, bias:  1});
        // var complete_selection    = make_selection({completed:  1, intercepted: 0, bias:  1});
        // var incomplete_selection  = make_selection({completed: -1, intercepted: 0, bias: -1});

        // $("#intercepted").hover(intercepted_selection, function() { hover_out_function(); });
        // $("#complete")   .hover(complete_selection,    function() { hover_out_function(); });
        // $("#incomplete") .hover(incomplete_selection,  function() { hover_out_function(); });

        // $("#intercepted").click(fix_selection(intercepted_selection));
        // $("#complete")   .click(fix_selection(complete_selection));
        // $("#incomplete") .click(fix_selection(incomplete_selection));

        // var sel_discriminant = 
        //     sel_completed.mul(completed).add(sel_intercepted.mul(intercepted));

        // var selection_predicate = sel_discriminant.gt(sel_bias);
        // var is_selected = selection_enabled.eq(1).and(selection_predicate);

        // var final_color = Shade.ifelse(is_selected, selected_color, unselected_color);

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
            var strs = ["Q1", "Q2", "Q3", "Q4", "OT",
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

        Facet.Scene.add(Facet.Marks.dots({
            position: interactor.camera(pt),
            fill_color: Shade.vec(0,0,0,0.1),
            stroke_width: -1,
            point_diameter: interactor.zoom.mul(100).pow(0.666),
//            Shade.ifelse(is_selected, interactor.zoom.mul(100).pow(0.666).mul(2), interactor.zoom.mul(100).pow(0.666)),
            elements: data.length/7
        }));
    });
});
