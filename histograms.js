function make_plays_histogram(plays, element)
{
    var bin_width = 15;
    var result = [];
    var probability = [];
    var totals = [];
    var i;
    for (i=0; i<Math.floor(4500 / bin_width); ++i) {
        result.push([0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        probability.push([0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        totals.push(0);
    }
    for (i=0; i<plays.plays.length; i+=8) {
        var time = Math.floor((3600 - plays.plays[i]) / bin_width), kind = plays.plays[i+4];
        result[time][kind] += 1;
        totals[time] += 1;
    }
    for (i=0; i<probability.length; ++i) {
        for (var j=0; j<14; ++j)
            probability[i][j] = result[i][j] / totals[i];
    }

    var width = 1200,
        height = 300;

    var svg = element.append("svg")
        .attr("width", width)
        .attr("height", height);

    var time_bins = _.range(300);

    var x_scale = d3.scale.linear().domain([0, 300]).range([0, width]);
    var y_scale = d3.scale.linear().domain([0, 1]).range([height, 0]);

    var histo_play_kind = 3;
    
    var plot = svg.selectAll("rect")
        .data(time_bins)
        .enter()
        .append("rect")
        .attr("x", function(d) { return x_scale(d); })
        .attr("y", function(d) { return y_scale(probability[d][histo_play_kind]); })
        .attr("width", x_scale(1) - x_scale(0))
        .attr("height", function(d) { return y_scale(1 - probability[d][histo_play_kind]); })
        .attr("fill", "red")
    ;

    return {
        plot: plot,
        counts: result,
        probability: probability,
        set_play: function(kind) {
            histo_play_kind = kind;
            plot.transition()
                .attr("y", function(d) { return y_scale(probability[d][histo_play_kind]); })
                .attr("height", function(d) { return y_scale(1-probability[d][histo_play_kind]); });
        }
    };
}
