# YT Chronicles: A Visualization Project

## Overview

**YT Chronicles** is a web-based visualization tool that provides insights into YouTube statistics globally. The project presents dynamic visualizations to explore trends in video views, subscriber counts, and earnings for YouTubers, organized by countries and categories.

## Project Links
- **Website:** [YT Chronicles](https://dataviscourse2024.github.io/group-project-yt-chronicles/)
- **Demo Video:** [Screencast on YouTube](https://youtu.be/bPcibP4kwIE)

The project contains index.html,style.css and script.js which are the code sections.Apart from these we have data_preprocess.py for cleaning the Global YouTube Statistics.csv. The processed data is data\data.csv.

### Features
The user can click on a country from world map and corresponding bar chart changes based on country selected. The bar chart can also be changed based on views, subscribers and earnings. We added transitions wherever necessary.Apart from the obvious interactive features the layout adjusts to different screen sizes and the youtube stats table maintains header while scrolling for better usability.

### Libraries
We used D3.js for interactive visualizations in javascript. We used pandas library to clean the data in data_preprocess.py.

### Data Source: [Youtube Statistics](https://www.kaggle.com/datasets/nelgiriyewithana/global-youtube-statistics-2023) 
