(function($) {
  'use strict';
  $.fn.andSelf = function() {
    return this.addBack.apply(this, arguments);
  }
  $(function() {
    const total = document.getElementById('earnings').innerHTML.replace(/[^0-9]/g, '');
    const cod = document.getElementById('cod').innerHTML.replace(/[^0-9]/g, '');
    const razorpay= document.getElementById('razorpay').innerHTML.replace(/[^0-9]/g, '');
    const Wallet= document.getElementById('wallet').value.replace(/[^0-9]/g, '');
    if ($("#transaction-history").length) {
      var areaData = {
        labels: ["Razorpay", "COD","Wallet",],
        datasets: [{
            data: [razorpay, cod, Number(Wallet)],
            backgroundColor: [
              "#01001a","#00d25b","#ffab00",
            ]
          }
        ]
      };
      var areaOptions = {
        responsive: true,
        maintainAspectRatio: true,
        segmentShowStroke: false,
        cutoutPercentage: 70,
        elements: {
          arc: {
              borderWidth: 0
          }
        },
        legend: {
          display: false
        },
        tooltips: {
          enabled: true
        }
      }
      var transactionhistoryChartPlugins = {
        beforeDraw: function(chart) {
          var width = chart.chart.width,
              height = chart.chart.height,
              ctx = chart.chart.ctx;

          ctx.restore();
          var fontSize = 1;
          ctx.font = fontSize + "rem sans-serif";
          ctx.textAlign = 'left';
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#ffffff";

          var text ="₹"+ total,
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2.4;

          ctx.fillText(text, textX, textY);

          ctx.restore();
          var fontSize = 0.75;
          ctx.font = fontSize + "rem sans-serif";
          ctx.textAlign = 'left';
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#6c7293";

          var texts = "Total",
              textsX = Math.round((width - ctx.measureText(text).width) / 1.93),
              textsY = height / 1.7;

          ctx.fillText(texts, textsX, textsY);
          ctx.save();
        }
      }
      var transactionhistoryChartCanvas = $("#transaction-history").get(0).getContext("2d");
      var transactionhistoryChart = new Chart(transactionhistoryChartCanvas, {
        type: 'doughnut',
        data: areaData,
        options: areaOptions,
        plugins: transactionhistoryChartPlugins
      });
    }
    });
})(jQuery);