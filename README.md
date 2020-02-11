Listen-to-transformer
====================
[Piano Transformer](https://magenta.tensorflow.org/piano-transformer) is an open source machine learning model from the [Magenta](https://magenta.tensorflow.org/) research group at Google that can generate musical performances with some long-term structure. We find it interesting to see what these models can and can’t do, so we made this app to make it easier to explore and curate the model’s output.

If you listen to a bunch of samples, you’ll probably discover that these compositions (like a lot of fully AI-generated music) are nowhere near as good and interesting as what people compose. And that’s okay! We just thought it would be fun for more people to be able to hear them, think about them, or remix them in their own music.So here is a radio station of 10000 random, not cherry-picked, samples. They are all downloadable as MIDI files under a CC0 (“No Rights Reserved”) license, so if you want to take one of the pieces and make it your own, do it -- we’d love to hear all about it!

The artwork for each song is algorithmically generated based on the notes in the song itself -- while the notes are represented by random shapes, the opacity represents the velocity, and the size represents the length of each note. On the left, a [song]() with longer and louder held notes. Center, [one]() with very short punctuated notes. On the right, a mix of notes that are overall much [quieter]() than in the previous two.

<img width="600" alt="Album art for 3 different songs" src="https://user-images.githubusercontent.com/1369170/74288605-b36f7480-4ce1-11ea-8606-9eeef26b6451.png">

For those interested in all the ones and zeros of this work, you can read more about the model in the [blog post](https://magenta.tensorflow.org/music-transformer) announcing it, the [research paper](https://arxiv.org/abs/1809.04281) it was published in, or the [blog post]() about this app.
