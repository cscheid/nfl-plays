$().ready(function() {

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
    Facet.Net.json("data/passes_array.json", function(data) {
        data = new Float32Array(data);
        var secs = Facet.attribute_buffer({
            vertex_array: data,
            item_size: 1,
            stride: 32,
            offset: 4
        });
        var yards = Facet.attribute_buffer({
            vertex_array: data,
            item_size: 1,
            stride: 32,
            offset: 16
        });
        var completed = Facet.attribute_buffer({
            vertex_array: data,
            item_size: 1,
            stride: 32,
            offset: 24
        });
        var intercepted = Facet.attribute_buffer({
            vertex_array: data,
            item_size: 1,
            stride: 32,
            offset: 20
        });
        var yardage = Facet.attribute_buffer({
            vertex_array: data,
            item_size: 1,
            stride: 32,
            offset: 28
        });
        var pt = Shade.vec(
            Shade(3600).sub(secs).div(3600).mul(100),
            Shade(100).sub(yards).div(100).mul(20)
            );

        var unselected_color = Shade.vec(0,0,0,0.1);
        var selected_color = Shade.parameter("vec4", vec.make([1,0,0,1]));
        var selection_enabled = Shade.parameter("float", 0);

        var sel_completed   = Shade.parameter("float", 0);
        var sel_intercepted = Shade.parameter("float", 0);
        var sel_bias        = Shade.parameter("float", 0);

        function make_selection(vec) {
            return function() {
                sel_completed.set(vec.completed);
                sel_intercepted.set(vec.intercepted);
                sel_bias.set(vec.bias * 0.9);
                selection_enabled.set(1);
                Facet.Scene.invalidate();
            };
        }

        function remove_selection() {
            selection_enabled.set(0);
            Facet.Scene.invalidate();
        }

        $("#intercepted").hover(make_selection({completed:  0, intercepted: 1, bias:  1}), remove_selection);
        $("#complete")   .hover(make_selection({completed:  1, intercepted: 0, bias:  1}), remove_selection);
        $("#incomplete") .hover(make_selection({completed: -1, intercepted: 0, bias: -1}), remove_selection);

        var sel_discriminant = 
            sel_completed.mul(completed).add(sel_intercepted.mul(intercepted));

        var selection_predicate = sel_discriminant.gt(sel_bias);
        var is_selected = selection_enabled.eq(1).and(selection_predicate);

        var final_color = Shade.ifelse(is_selected, selected_color, unselected_color);

        Facet.Scene.add(Facet.Marks.dots({
            position: interactor.camera(pt),
            fill_color: final_color,
            stroke_width: -1,
            point_diameter: Shade.ifelse(is_selected, interactor.zoom.mul(100).pow(0.666).mul(2), interactor.zoom.mul(100).pow(0.666)),
            elements: data.length/8
        }));
    });
});
