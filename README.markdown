jQuery.ganttView
================

The jQuery.ganttView plugin is a very lightweight plugin for creating a Gantt chart in plain HTML...no vector graphics or images required.  The plugin supports dragging and resizing the Gantt blocks and callbacks to trap the updated data.

[![Sample Gantt](https://raw.githubusercontent.com/thegrubbsian/jquery.ganttView/master/example/jquery-ganttview.png) A sample chart](http://thegrubbsian.github.io/jquery.ganttView/example/index.html)


Browser Compatibility
---------------------
Currently the plugin has been tested, and is working in: FF 3.5+, Chrome 5+, Safari 4+, IE8+.  There are minor issues in IE7 and I haven't even attempted to use it in IE6.  If you encounter any issues with any version of Internet Explorer and would like to contribute CSS fixes please do so, several people have asked for IE6 support.


Dependencies
------------
The plugin depends on the following libraries:

- jQuery 1.4 or higher (obviously)
- jQuery-UI 1.8 or higher
- date.js


Documentation
-------------
Forthcoming...

    *showWeekends; default to true
      * boolean value to determine 
    * data
      * the data object; no default
    * buffer; default to 1 day buffer
      * number of days to add to the grid pre/post start/end
    * cellBuffer; default to 5 cells
      * number of cells to display prior to the start time
    * dateChunks; default to 1 for backwards compatibility
      * how many chunks to split each day into [ie how many cells make up one day]
        * 1 = daily, 24 = hourly, 1440 = by minutes but can be any number
    * freezeDate; default to null
      * date before which to allow no edits 
        * NOTE: A TASK CAN STILL BE RESIZED SUCH THAT IT'S END APPEARS TO BE BEHIND THE FREEZEDATE; HOWEVER, THE SAVED END DATE IS CORRECT
    * displayGroupedTitles; default to true to maintain backwards compatibility
      * boolean value to determine whether to list all block titles
    * reorder; defaults to true to maintain backwards compatibility
      * boolean value setting whether or not tasks can be reordered
    * displayHoursOnBlock; defaults to true to maintain backwards compatibility
      * boolean value setting whether or not the duration in hours should be displayed on the block
    * updateDependencies; default to false to maintain backwards compatibility
      * boolean value to determine whether to update all of the following items in a series when the preceding one's end date is changed
    * doNotDisplayTagged; default to [] to maintain backwards compatibility
      * array of strings to ignore from data
    * cellWidth; default to 21
      * width of each cell on the grid
    * cellHeight; default to 31
      * height of each cell on the grid
    *slideWidth; default to 400
      * width of the displayed portion of the grid
    * groupBySeries; default to false
      * boolean value to determine whether to list all tasks under the same series on the same row
    * groupById; default to false
      * boolean value to determine whether to list all tasks with the same id on the same row
    * groupByIdDrawAllTitles; default to false
      * boolean value to determine whether to draw all titles if grouped by id (?)
    * vHeaderWidth; default to 100
      * width of the section to the right of the grid
    * behavior
      * clickable; default to true
        * boolean value to determine whether the tasks can be clicked
      * draggable; default to true
        * boolean value to determine whether the tasks can be dragged to new locations
      * resizable; default to true
        * boolean value to determine whether tasks can be resized
      * onClick
        * function that is run whenever a task is clicked
      * onDrag
        * function that is run whenever a task is dragged
      * onResize
        * function that is run whenever a task is resized

Contribution Guidelines
------------
The internal roadmap for the plugin is detailed in the project wiki. If you're interested in features outside of what's described there, we'd be interested to discuss pull requests that would add these features.  If you like the plugin, feel free to fork it and submit your patches back.

**Guidelines:** If you'd like to offer a new feature please help us out by submitting the pull request with only the fewest changes necessary. 

Ideal: Fork the project, apply just the individual changes to the individual files effected, submit pull request. 

Those pull requests can usually be automatically merged and closed through the site here. 

If your pull request includes things like:

- changes to dependencies or where they're hosted
- stylistic modifications
- moving project files to different directories
- more than one new feature / functional change

one of us will have to do the work of carving out just the feature being pulled. Your request is likely to sit unmerged for a while if that's the case. 


License
-------
The jQuery.ganttView plugin may be used free of charge under the conditions 
of the following license:

The MIT License

Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
