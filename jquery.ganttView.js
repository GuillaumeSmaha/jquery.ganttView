/*
jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/

/*
Options
-----------------
showWeekends: boolean
data: object
buffer: number
cellBuffer: number
dateChunks: number
updateDependencies: boolean
cellWidth: number
cellHeight: number
slideWidth: number
groupBySeries: boolean
groupById: boolean
groupByIdDrawAllTitles: boolean
dataUrl: string
behavior: {
    clickable: boolean,
    draggable: boolean,
    resizable: boolean,
    onClick: function,
    onDrag: function,
    onResize: function
}
*/
var dayInMS = 86400000;

(function (jQuery) {

    jQuery.fn.ganttView = function () {
        var args = Array.prototype.slice.call(arguments);
        
        if (args.length == 1 && typeof(args[0]) == "object") {
            build.call(this, args[0]);
        }
        
        if (args.length == 2 && typeof(args[0]) == "string") {
            handleMethod.call(this, args[0], args[1]);
        }
    };
    
    function build(options) {
        var els = this;
        var defaults = {
            showWeekends: true,
            buffer: 1, //default to 1 day buffer (number of days to add to the grid pre/post start/end)
            cellBuffer: 5, //number of cells to display prior to the start time
            dateChunks: 1, //default to day (how many chunks to split each day into [ie how many cells make up one day])
            freezeDate: null, //default to no freezeDate
            displayGroupedTitles: true, //default to true
            updateDependencies: false, //default to false to maintain backwards compatibility
            cellWidth: 21,
            cellHeight: 31,
            slideWidth: 400,
            groupBySeries: false,
            groupById: false,
            groupByIdDrawAllTitles: false,
            vHeaderWidth: 100,
            behavior: {
                clickable: true,
                draggable: true,
                resizable: true
            }
        };
        
        var opts = jQuery.extend(true, defaults, options);

        if (opts.data) {
            build();
        } else if (opts.dataUrl) {
            jQuery.getJSON(opts.dataUrl, function (data) { opts.data = data; build(); });
        }
        
        function build() {
            var minCells = Math.floor((opts.slideWidth / opts.cellWidth)  + 5);
            var startEnd = DateUtils.getBoundaryDatesFromData(opts.data, opts.dateChunks, opts.buffer, minCells);
            opts.start = startEnd[0];
            opts.end = startEnd[1];
            opts.chunksToStartTime = startEnd[2];

            els.each(function () {
                var container = jQuery(this);
                var div = jQuery("<div>", { "class": "ganttview" });

                new Chart(div, opts).render();

                container.append(div);

                var w = jQuery("div.ganttview-vtheader", container).outerWidth() +
                        jQuery("div.ganttview-slide-container", container).outerWidth();

                container.css("width", (w + 2) + "px");

                new Behavior(container, opts).apply();
            });
        }
    }

    function handleMethod(method, value) {
        if (method == "setSlideWidth") {
            var div = $("div.ganttview", this);
            div.each(function () {
                var vtWidth = $("div.ganttview-vtheader", div).outerWidth();
                $(div).width(vtWidth + value + 1);
                $("div.ganttview-slide-container", this).width(value);
            });
        }
    }

    var Chart = function(div, opts) {

        function render() {

            addVtHeader(div, opts.data, opts.dateChunks, opts.cellHeight, opts.groupBySeries, opts.groupById, opts.groupByIdDrawAllTitles, opts.displayGroupedTitles);

            var slideDiv = jQuery("<div>", {
                "class": "ganttview-slide-container",
                "css": { "width": opts.slideWidth + "px" }
            });
            
            dates = getDates(opts.start, opts.end);

            addHzHeader(slideDiv, opts.start, dates, opts.dateChunks, opts.cellWidth);
            addGrid(slideDiv, opts.data, dates, opts.dateChunks, opts.freezeDate, opts.cellWidth, opts.cellHeight, opts.showWeekends, opts.groupBySeries, opts.groupById, opts.groupByIdDrawAllTitles);
            addBlockContainers(slideDiv, opts.data, opts.dateChunks, opts.cellHeight, opts.groupBySeries, opts.groupById, opts.groupByIdDrawAllTitles);
            addBlocks(slideDiv, opts.data, opts.dateChunks, opts.cellWidth, opts.cellHeight, opts.start, opts.groupBySeries, opts.groupById, opts.groupByIdDrawAllTitles);
            div.append(slideDiv);
            applyLastClass(div.parent());
        }
        
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Creates a 3 dimensional array [year][month][day] of every day 
        // between the given start and end dates
        function getDates(start, end) {
            var dates = [];
            dates[start.getFullYear()] = [];
            dates[start.getFullYear()][start.getMonth()] = [start]
            var last = start;

            while (last.compareTo(end) == -1) {
                var next = last.clone().addDays(1);
                if (!dates[next.getFullYear()]) { dates[next.getFullYear()] = []; }

                if (!dates[next.getFullYear()][next.getMonth()]) { 
                    dates[next.getFullYear()][next.getMonth()] = []; 
                }

                dates[next.getFullYear()][next.getMonth()].push(next);
                last = next;
            }

            return dates;
        }

        function addVtHeader(div, data, dateChunks, cellHeight, groupBySeries, groupById, groupByIdDrawAllTitles, displayGroupedTitles) {
            var listId = {};
            var rowIdx = 1;
            var vthHeight = 41;
            var headerDiv = jQuery("<div>", { 
                                                "class": "ganttview-vtheader",
                                                "css": { "margin-top": vthHeight + "px" } });
            if(dateChunks > 1){
                var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                itemDiv.append(jQuery("<div>", {
                    "css": { 
                        "height": cellHeight*2/3 + "px",
                        "float":"right",
                        "padding-right":cellHeight/4+"px",
                        }
                }).append("Time"));
                headerDiv.append(itemDiv);
            }

            for (var i = 0; i < data.length; i++)
            {
                if(groupBySeries)
                {
                    var id = "" + data[i].id;
                    if(groupById && id.length > 0)
                    {
                       if(typeof listId[ id ] == "undefined")
                       {
                            var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                            itemDiv.append(jQuery("<div>", {
                                "class": "ganttview-vtheader-item-name",
                                "css": { "height": cellHeight + "px" }
                            }).append(data[i].name));

                            if(displayGroupedTitles){
                                var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
                                var seriesNames = new Array();
                                for (var j = 0; j < data[i].series.length; j++)
                                {
                                    seriesNames.push(data[i].series[j].name);
                                }
                                seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" }).append(seriesNames.join(', ')));
                            }
                            
                            itemDiv.append(seriesDiv);
                            headerDiv.append(itemDiv);

                            listId[ id ] = rowIdx;

                            rowIdx ++;
                        }
                        else
                        {
                            if(groupByIdDrawAllTitles)
                            {
                                var localCellHeight = cellHeight;
                                var itemDiv = headerDiv.children(':nth-child('+listId[ id ]+')');
                                localCellHeight = cellHeight * (itemDiv.find('.ganttview-vtheader-item-name > br').length + 1);
                                itemDiv.find('.ganttview-vtheader-item-name').append('<br />'+data[i].name).css('height', localCellHeight);

                                if(displayGroupedTitles){
                                    var seriesNames = new Array();
                                    for (var j = 0; j < data[i].series.length; j++)
                                    {
                                        seriesNames.push(data[i].series[j].name);
                                    }

                                    itemDiv.find('.ganttview-vtheader-series-name').append('<br />'+seriesNames.join(', ')).css('height', localCellHeight);
                                }
                            }
                        }
                    }
                    else
                    {
                        var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                        itemDiv.append(jQuery("<div>", {
                            "class": "ganttview-vtheader-item-name",
                            "css": { "height": cellHeight + "px" }
                        }).append(data[i].name));

                        if(displayGroupedTitles){
                            var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
                            var seriesNames = new Array();
                            for (var j = 0; j < data[i].series.length; j++)
                            {
                                seriesNames.push(data[i].series[j].name);
                            }
                            seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" }).append(seriesNames.join(', ')));
                        }
                        itemDiv.append(seriesDiv);
                        headerDiv.append(itemDiv);
                    }
                }
                else
                {
                    var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                    itemDiv.append(jQuery("<div>", {
                        "class": "ganttview-vtheader-item-name",
                        "css": { "height": (data[i].series.length * cellHeight) + "px" }
                    }).append(data[i].name));

                    if(displayGroupedTitles){
                        var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
                        for (var j = 0; j < data[i].series.length; j++)
                        {
                            seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" })
                                .append(data[i].series[j].name));
                        }
                    }
                    itemDiv.append(seriesDiv);
                    headerDiv.append(itemDiv);
                }
            }
            div.append(headerDiv);
        }

        function addHzHeader(div, startDate, dates, dateChunks, cellWidth) {
            var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
            var monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months" });
            var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" });
            var chunksDiv = jQuery("<div>", { "class": "ganttview-hzheader-chunks" });
            var totalW = 0;

            for (var y in dates) {
                mCount = 0;
                dates[y].forEach(function (m) {
                    var w = m.length * cellWidth * dateChunks;
                    totalW = totalW + w;
                    monthsDiv.append(jQuery("<div>", {
                        "class": "ganttview-hzheader-month",
                        "css": { "width": (w - 1) + "px" }
                    }).append(monthNames[mCount] + "/" + y));

                    m.forEach(function (d) {
                        daysDiv.append(jQuery("<div>", { 
                            "class": "ganttview-hzheader-day",
                            "css": { "width": (cellWidth*dateChunks - 1) + "px" }
                        }).append(d.getDate()));

                        if(dateChunks > 1){
                            let dayInMin = 2400;
                            let timeDiff = dayInMin/dateChunks;
                            let timeMark = 0;

                            for(var dateChunk=0; dateChunk < dateChunks; ++dateChunk){
                                var rightBorder = "1px solid #f0f0f0";
                                var cellTime = -1, cellText = "";

                                if (dateChunk == dateChunks - 1){ rightBorder = "1px solid #9999"; }
                                
                                if(dateChunk%2 == 0){
                                    if(timeMark%100 == 0){
                                        cellTime = timeMark;
                                    }
                                    else{
                                        var hourDecimal = timeMark%100;
                                        var minutes = Math.round(hourDecimal*3/5);
                                        if(minutes == 60){ minutes = 100; }
                                        cellTime = timeMark - hourDecimal + minutes; 
                                    }
                                }

                                if(cellTime > -1){
                                    cellText = cellTime.toString();
                                    while(cellText.length < 4){
                                        cellText = "0" + cellText;
                                    }
                                }

                                chunksDiv.append(jQuery("<div>", {
                                    "class": "ganttview-hzheader-chunk",
                                    "css": { 
                                        "width": (cellWidth-1) + "px",
                                        "border-right": rightBorder
                                    }
                                }).append(cellText));

                                timeMark += timeDiff;
                            }
                        }
                    })
                    ++mCount;
                })
            }

            monthsDiv.css("width", totalW + "px");
            daysDiv.css("width", totalW + "px");
            chunksDiv.css("width", totalW + "px");
            headerDiv.append(monthsDiv).append(daysDiv).append(chunksDiv);
            div.append(headerDiv);
        }

        function addGrid(div, data, dates, dateChunks, freezeDate, cellWidth, cellHeight, showWeekends, groupBySeries, groupById, groupByIdDrawAllTitles) {
            var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
            var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" }).css('height', cellHeight);

            let isPriorToFreeze = true, isFreezeDate = false;
            let freezeYear = freezeDate.getFullYear();
            let freezeMonth = freezeDate.getMonth();
            let freezeDay = freezeDate.getDate();

            for (var y in dates) {
                if(freezeDate && isPriorToFreeze && y > freezeYear){ 
                    isPriorToFreeze = false;
                }

                for (var m in dates[y]) {
                    if(freezeDate && isPriorToFreeze && y == freezeYear && m > freezeMonth){
                        isPriorToFreeze = false;
                    }

                    for (var d in dates[y][m]) {
                        let thisDay = dates[y][m][d].clone();
                        let isWeekendBool = showWeekends && DateUtils.isWeekend(thisDay);

                        if (freezeDate && isPriorToFreeze && m == freezeMonth && thisDay.getDate() == freezeDay) {
                            isPriorToFreeze = false;
                            isFreezeDate = true;
                        }
                        
                        for (var dateChunk = 0; dateChunk < dateChunks; ++dateChunk){
                            var cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell" });
                            if (isWeekendBool) { 
                                cellDiv.addClass("ganttview-weekend"); 
                            }
                            if(freezeDate && isPriorToFreeze) {
                                cellDiv.addClass("ganttview-frozen");
                            }
                            else if (freezeDate && isFreezeDate) {
                                let curTime = DateUtils.chunksToTime(dateChunk, dateChunks);

                                if(curTime.hrs <= freezeDate.getHours() && curTime.mins <= freezeDate.getMinutes()){                                    
                                    cellDiv.addClass("ganttview-frozen");
                                }
                                else{
                                    isFreezeDate = false;
                                }
                            }
                            rowDiv.append(cellDiv);
                        }
                    }
                }
            }

            var rowIdx = 1;
            var listId = {};
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
            rowDiv.css("width", w + "px");
            gridDiv.css("width", w + "px");
            for (var i = 0; i < data.length; i++)
            {
                if(groupBySeries)
                {
                    var id = "" + data[i].id;
                    if(groupById && id.length > 0)
                    {
                       if(typeof listId[ id ] === 'undefined')
                       {
                           gridDiv.append(rowDiv.clone());

                           listId[ id ] = {index: rowIdx, cnt: 0};

                           rowIdx ++;
                       }
                       else
                       {
                         if(groupByIdDrawAllTitles)
                         {
                           listId[ id ].cnt ++;
                           var itemRowDiv = gridDiv.children(':nth-child('+listId[ id ].index+')');
                           itemRowDiv.css('height', listId[ id ].cnt * cellHeight);
                           }
                       }
                   }
                   else
                   {
                       gridDiv.append(rowDiv.clone());
                   }
               }
               else
               {
                    for (var j = 0; j < data[i].series.length; j++)
                    {
                        gridDiv.append(rowDiv.clone());
                    }
                }
            }
            div.append(gridDiv);
        }

        function addBlockContainers(div, data, dateChunks, cellHeight, groupBySeries, groupById, groupByIdDrawAllTitles) {
            var rowIdx = 1;
            var listId = {};
            var blockOffset = 60;
            if (dateChunks <= 1) { blockOffset = 40; }
            var blocksDiv = jQuery("<div>", { 
                                                "class": "ganttview-blocks",
                                                "css": { "margin-top": blockOffset + "px" } 
                                            });
            for (var i = 0; i < data.length; i++)
            {
                if(groupBySeries)
                {
                    var id = "" + data[i].id;
                    if(groupById && id.length > 0)
                    {
                        if(typeof listId[ id ] === 'undefined')
                        {
                            blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));                         
                            listId[ id ] = {index: rowIdx, cnt: 0};
                            rowIdx ++;
                        }

                        else
                        {
                            if(groupByIdDrawAllTitles)
                            {
                                listId[ id ].cnt ++;
                                var itemBlockDiv = blocksDiv.children(':nth-child('+listId[ id ].index+')');
                                itemBlockDiv.css('height', listId[ id ].cnt * cellHeight - 3);
                            }
                        }
                    }

                    else
                    {
                        blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
                    }
                }
                else
                {
                    for (var j = 0; j < data[i].series.length; j++)
                    {
                        blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
                    }
                }
            }
            div.append(blocksDiv);
        }

        function addBlocks(div, data, dateChunks, cellWidth, cellHeight, start, groupBySeries, groupById, groupByIdDrawAllTitles) {
            var listId = {};
            var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div);
            var rowIdx = 0;

            for (var i = 0; i < data.length; i++)
            {
                if(groupBySeries)
                {
                    var id = "" + data[i].id;
                    if(groupById && id.length > 0)
                    {
                       if(typeof listId[ id ] == "undefined")
                        {
                            generateBlock(data[i], rows, rowIdx, groupBySeries, start, dateChunks, cellWidth);

                            listId[ id ] = rowIdx;
                            rowIdx = rowIdx + 1;
                        }
                        else
                        {
                            generateBlock(data[i], rows, listId[ id ], groupBySeries, start, dateChunks, cellWidth);
                        }
                    }
                    else
                    {
                        generateBlock(data[i], rows, rowIdx, groupBySeries, start, dateChunks, cellWidth);

                        rowIdx = rowIdx + 1;
                    }
                }
                else
                {
                    rowIdx = generateBlock(data[i], rows, rowIdx, groupBySeries, start, dateChunks, cellWidth);
                }
            }
        }

        function generateBlock(dataItem, rows, index, groupBySeries, start, dateChunks, cellWidth){ 
            for (var j = 0; j < dataItem.series.length; j++)
            {
                var series = dataItem.series[j];
                var size = DateUtils.timeInChunksBetween(series.start, series.end, dateChunks);
                var offset = DateUtils.timeInChunksBetween(start, series.start, dateChunks);

                var time = DateUtils.chunksToTime(size, dateChunks);

                var block = jQuery("<div>", {
                  "class": "ganttview-block",
                  "title": series.name + ", " + time.hrs + " hrs " + time.mins + " mins",
                  "css": {
                      "height": (parseInt(jQuery(rows[index]).css('height'), 10) - 4) + "px",
                      "width": ((size * (cellWidth)) - (9/dateChunks)) + "px",
                      "margin-left": ((offset * cellWidth)) + "px",
                      "top": 0
                    }
                });
                addBlockData(block, dataItem, series);
                if (dataItem.series[j].color) {
                    block.css("background-color", dataItem.series[j].color);
                }
                block.append(jQuery("<div>", { "class": "ganttview-block-text" }).text(size/dateChunks*24));
                jQuery(rows[index]).append(block);

                if (!groupBySeries) { ++index; }
            } 

            return index;
        }

        function addBlockData(block, data, series) {
            // This allows custom attributes to be added to the series data objects
            // and makes them available to the 'data' argument of click, resize, and drag handlers
            var blockData = { id: data.id, name: data.name };
            jQuery.extend(blockData, series);
            block.data("block-data", blockData);
        }

        function applyLastClass(div) {
            jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
        }
            
        return {
            render: render
        };
    }

    var Behavior = function (div, opts) {

        function apply() {
            jQuery("div.ganttview-slide-container", div).scrollLeft(getScrollTo(opts.buffer, opts.dateChunks, opts.chunksToStartTime, opts.cellWidth, opts.cellBuffer));

            if (opts.behavior.clickable) { 
                bindBlockClick(div, opts.behavior.onClick); 
            }
            
            if (opts.behavior.resizable) {
                bindBlockResize(div, opts.dateChunks, opts.cellBuffer, opts.cellWidth, opts.start, opts.freezeDate, opts.updateDependencies, opts.behavior.onResize); 
            }
            
            if (opts.behavior.draggable) {
                bindBlockDrag(div, opts.dateChunks, opts.cellBuffer, opts.cellWidth, opts.start, opts.freezeDate, opts.updateDependencies, opts.behavior.onDrag); 
            }
        }

        function bindBlockClick(div, callback) {
            jQuery("div.ganttview-block", div).live("click", function () {
                if (callback) { callback(jQuery(this).data("block-data")); }
            });
        }
        
        function bindBlockResize(div, dateChunks, cellBuffer, cellWidth, startDate, freezeDate, updateDependencies, callback) {
            for(var block in jQuery("div.ganttview-block", div)){
                if(block == parseInt(block)){
                    var thisBlock = jQuery(jQuery("div.ganttview-block", div)[block]);
                    var blockEnd = thisBlock.data("block-data").end;

                    if(!freezeDate || blockEnd > freezeDate){
                        thisBlock.resizable({
                            grid: cellWidth, 
                            handles: "e",
                            stop: function () {
                                var block = jQuery(this);
                                var updatedData = [];

                                updateDataAndPosition(div, block, updatedData, dateChunks, cellBuffer, cellWidth, startDate, freezeDate, updateDependencies, true);
                                if (callback) { callback(updatedData); }
                            }
                        });
                    }
                }
            }
        }
        
        function bindBlockDrag(div, dateChunks, cellBuffer, cellWidth, startDate, freezeDate, updateDependencies, callback) {
            for(var block in jQuery("div.ganttview-block", div)){
                if(block == parseInt(block)){
                    var thisBlock = jQuery(jQuery("div.ganttview-block", div)[block]);
                    var blockStart = thisBlock.data("block-data").start;

                    if(!freezeDate || blockStart > freezeDate){
                        thisBlock.draggable({
                            axis: "x", 
                            grid: [cellWidth, cellWidth],
                            stop: function () {
                                var block = jQuery(this);
                                var updatedData = [];

                                updateDataAndPosition(div, block, updatedData, dateChunks, cellBuffer, cellWidth, startDate, freezeDate, updateDependencies, false);
                                if (callback) { callback(updatedData); }
                            }
                        });
                    }
                }
            }
        }
        
        function updateDataAndPosition(div, block, updatedData, dateChunks, cellBuffer, cellWidth, startDate, freezeDate, updateDependencies, isResize) {
            var parentChildren = block.parent().children();
            var childElementCount = parentChildren.length;
            var index;

            var container = jQuery("div.ganttview-slide-container", div);
            var scroll = container.scrollLeft();
            var offset = block.offset().left - container.offset().left - 1 + scroll;

            let i=0;

            while (!index && i<childElementCount){
                if(parentChildren[i] == block[0]){
                    index = i;
                }
                ++i;
            }

            // Set new start date
            var oldStart = block.data("block-data").start
            var startOffsetChunks = getOffsetChunks(startDate, oldStart, offset, cellWidth, dateChunks);

            var newStart = updateDate(startDate, startOffsetChunks, dateChunks);

            //if the block is moved to be before the freezeDate, set newStart to be the freezeDate
            if (freezeDate && !isResize && newStart < freezeDate){
                newStart = updateDate(freezeDate, 0, dateChunks);

                offset = DateUtils.timeInChunksBetween(startDate, freezeDate, dateChunks)*cellWidth;
            }

            // Set new end date
            var oldEnd = block.data("block-data").end;
            var width = block.outerWidth();
            var offsetChunks;

            isResize
                ? offsetChunks = getOffsetChunks(oldStart, oldEnd, width, cellWidth, dateChunks)
                : offsetChunks = DateUtils.timeInChunksBetween(oldStart, oldEnd, dateChunks);

            var newEnd = updateDate(newStart, offsetChunks, dateChunks);

            //if the end date is moved prior to the freeze date, set newEnd to freezeDate
            //NOTE: BLOCK WILL STILL DISPLAY AS BEING PRIOR TO (but endDate should be correct)
            if (freezeDate && isResize && newEnd < freezeDate){
                newEnd = updateDate(freezeDate, 0, dateChunks);
            }

            var endChanged = newEnd.valueOf()!=oldEnd.valueOf();

            var newDuration = DateUtils.chunksToTime(DateUtils.timeInChunksBetween(newStart, newEnd, dateChunks), dateChunks);
            var newText = newDuration.hrs;

            updateBlockDataAndCss(block, newStart, newEnd, newText, offset);
            updatedData.push(block.data("block-data"));

            var chunksDiff = DateUtils.timeInChunksBetween(oldEnd, newEnd, dateChunks);
            //if nextSibling
            if(updateDependencies && index < childElementCount-1 && endChanged){
                updateFollowing(offset + width, newEnd, chunksDiff, jQuery(parentChildren[index+1]), updatedData, dateChunks, cellWidth);
            }
        }

        function updateFollowing(offset, prevEnd, offsetChunks, block, updatedData, dateChunks, cellWidth){
            var parentChildren = block.parent().children();
            var childElementCount = parentChildren.length;
            var index;

            let i=0;

            while (!index && i<childElementCount){
                if(parentChildren[i] == block[0]){
                    index = i;
                }
                ++i;
            }

            // Set new start date
            var oldStart = block.data("block-data").start

            var newStart = updateDate(oldStart, offsetChunks, dateChunks);

            if (newStart < prevEnd){
                newStart = updateDate(prevEnd, 0, dateChunks);

                offsetChunks = DateUtils.timeInChunksBetween(oldStart, prevEnd, dateChunks);
            }

            var startChanged = newStart.valueOf()!=oldStart.valueOf();

            // Set new end date
            var oldEnd = block.data("block-data").end;
            var chunksFromStartToEnd = DateUtils.timeInChunksBetween(oldStart, oldEnd, dateChunks);

            var newEnd = updateDate(oldEnd, chunksFromStartToEnd, dateChunks);


            var newText = parseInt(chunksFromStartToEnd/dateChunks)+1;
            var pixelOffset = parseFloat(block.css("margin-left")) + (offsetChunks*cellWidth);

            updateBlockDataAndCss(block, newStart, newEnd, newText, pixelOffset);
            updatedData.push(block.data("block-data"));

            var endChanged = newEnd.valueOf()!=oldEnd.valueOf();

            //if nextSibling
            if(index < childElementCount-1 && endChanged){
                updateFollowing(pixelOffset + chunksFromStartToEnd*cellWidth, offsetChunks, jQuery(parentChildren[index+1]), updatedData, dateChunks, cellWidth);
            }
        }

        function getOffsetChunks(oldDate, newDate, offset, cellWidth, dateChunks){
            var chunksFromOldDate = Math.floor(offset / cellWidth);
            var chunksFromOldDateToNewDate = DateUtils.timeInChunksBetween(oldDate, newDate, dateChunks);
            var offsetChunks = Math.floor(chunksFromOldDateToNewDate) - chunksFromOldDate;

            return chunksFromOldDateToNewDate - offsetChunks;
        }

        function updateDate(oldDate, offsetChunks, dateChunks){
            var chunkInMS = dayInMS/dateChunks;

            return new Date(oldDate.clone().getTime() + (offsetChunks*chunkInMS));
        }

        function updateBlockDataAndCss(block, newStart, newEnd, newText, pixelOffset){
            block.data("block-data").start = newStart;
            block.data("block-data").end = newEnd;
            jQuery("div.ganttview-block-text", block).text(newText);

            // Remove top and left properties to avoid incorrect block positioning,
            // set position to relative to keep blocks relative to scrollbar when scrolling
            block.css("top", "0").css("left", "0")
            .css("position", "absolute").css("margin-left", pixelOffset + "px");
        }

        function getScrollTo(buffer, dateChunks, chunksToStartTime, cellWidth, cellBuffer){
            var bufferInChunks = buffer*dateChunks;

            return (bufferInChunks + chunksToStartTime - cellBuffer) * cellWidth

        }

        return {
            apply: apply    
        };
    }

    var ArrayUtils = {

        contains: function (arr, obj) {
            var has = false;

            for (var i = 0; i < arr.length; i++) { 
                if (arr[i] == obj) { has = true; } 
            }

            return has;
        }
    };

    var DateUtils = {
        chunksToTime(size, dateChunks){
            var timeInMs = size/dateChunks;
            var hrsDec = timeInMs * 24;
            var hrs, mins;

            hrsDec % 1 == 0 ? hrs = hrsDec : hrs = Math.floor(hrsDec);
            mins = Math.round(60*(hrsDec - hrs));

            return {hrs, mins}
        },

        timeInChunksBetween: function (start, end, dateChunks) {
            var timeInMs = end.valueOf() - start.valueOf();

            return timeInMs*dateChunks/dayInMS;
        },

        isWeekend: function (date) {
            return date.getDay() % 6 == 0;
        },

        getBoundaryDatesFromData: function (data, dateChunks, buffer, minCells) {
            var minStart = new Date(); maxEnd = new Date();
            var chunksToStartTime;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    var start = Date.parse(data[i].series[j].start).clone();
                    var end = Date.parse(data[i].series[j].end).clone()
                    if (i == 0 && j == 0) { minStart = start; maxEnd = end; }
                    if (minStart.compareTo(start) == 1) { minStart = start; }
                    if (maxEnd.compareTo(end) == -1) { maxEnd = end; }
                }
            }

            let zeroedStart = new Date(minStart.clone().setHours(0)).setMinutes(0);

            chunksToStartTime = Math.floor(DateUtils.timeInChunksBetween(zeroedStart, minStart, dateChunks));

            //start at midnight
            if(minStart.getHours() > 0 || minStart.getMinutes() > 0){
                minStart = new Date(zeroedStart);
            }

            //add boundary dates to either end
            minStart.addDays(-1*buffer);
            maxEnd.addDays(buffer);
            
            return [minStart, maxEnd, chunksToStartTime];
        }
    };

})(jQuery);
