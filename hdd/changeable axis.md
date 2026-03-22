Now, lets also come up with an even more ambitious plan: 

What I wanna do is for every filter where it makes sense, have a button or something, lets talk about this part of the implementation, that we can press. "Use as Axis" something like that. What shoud happen then is that we completely change the plot in that we use that filter as the x axis instead of temperature. Im imagining for example they pick vanadium, every entry that has that gets plottet with x axis the amount of vanadium. since all the data also has a temperature attached we would probably have to encode that somehow, maybe a heat plot sort of thing where the color changes from blue to red depending on temperature (or maybe veridian heat map or something). or if they pick Material class, since that is no continous thing, we would plot that with distinct buckets, you know?

This is not really a filter action type of thing but it makes sense to attach this to the filter buttons cuz thats the only place where people mock about. the problem is arrhenious and stuff because that would now become a straight line and that might make stuff messy, so we would have to also give people an option to maybe set a specific temperature to display, which is awesome becaues we already need to change the Plot Options window for this mode. The "Axis Limits" in this mode would be set via the actual filter (for things like vanadium content) and dont even make sense for things with buckets like Material class. SO we could morph this into a temperature select.

The way it should behave: I set some filters, then I go to some option, say Surface Conditions, this has a few entries left depending on filters set before. i click the button make x-axis and the then it uses those available options as the buckets on x axis. This assumes none of the options are selected in surface condition. if i do select some, then those now become the buckets

things to fix:
    plotting options lyaout and logic
    fin/fix bugs in actual filter logic (I cant seem to find any? wtf? is this the first time no bugs?)
    diffeerent heat maps and also nuber son the heatmap
    SVG export?

 oh and is it possible to make the color bar in the daigram (what should I call this?) clickable to 
