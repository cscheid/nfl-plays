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
        clearColor: [0,0,0,0.2],
        interactor: interactor
    });
    Facet.Net.json("data/passes_array.json", function(data) {
        data = new Float32Array(data);
        var secs = Facet.attribute_buffer({
            vertex_array: data,
            item_size: 1,
            stride: 20,
            offset: 4
        });
        var yards = Facet.attribute_buffer({
            vertex_array: data,
            item_size: 1,
            stride: 20,
            offset: 16
        });
        var pt = Shade.vec(
            Shade(3600).sub(secs).div(3600).mul(100),
            Shade(100).sub(yards).div(100).mul(20)
            );
        Facet.Scene.add(Facet.Marks.dots({
            position: interactor.camera(pt),
            fill_color: Shade.vec(0,0,0,0.2),
            stroke_color: Shade.vec(0,0,0,0.2),
            point_diameter: interactor.zoom.mul(100).pow(0.666),
            elements: data.length/5
        }));
    });
});
