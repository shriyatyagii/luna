# Luna — AI Creative Studio

An AI creative studio exploring the intersection of code, cinema, and imagination.

## Setup

1. Clone the repo
2. Add video clips to `assets/clips/` (clip-1.mp4 through clip-5.mp4)
3. Serve locally:
   ```bash
   python3 -m http.server 8000
   ```
4. Open [http://localhost:8000](http://localhost:8000)

## Project Structure

```
├── index.html       # Main page
├── style.css        # Styles
├── script.js        # Interactions & montage logic
└── assets/
    └── clips/       # Video clips (not tracked in git)
```

## Notes

Video clips are excluded from git due to file size. If you're collaborating, either:
- Share clips separately and place them in `assets/clips/`
- Set up [Git LFS](https://git-lfs.github.com/) to track `*.mp4` files
