const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/english-blog';

const articles = [
  {
    title: '10 Common English Idioms for Daily Conversation',
    slug: '10-common-english-idioms',
    content: `
# 10 Common English Idioms

Idioms are a vital part of the English language. Here are 10 that you can use every day:

1. **Piece of cake** - Something very easy.
   *Example: "That exam was a piece of cake."*

2. **Break a leg** - Good luck.
   *Example: "Break a leg at your performance tonight!"*

3. **Under the weather** - Feeling sick.
   *Example: "I'm feeling a bit under the weather today."*

4. **Better late than never** - It's better to arrive or do something late than not at all.
   *Example: "I finally finished the report. Better late than never!"*

5. **Bite the bullet** - To get something over with because it is inevitable.
   *Example: "I hate going to the dentist, but I just have to bite the bullet."*

6. **Call it a day** - Stop working on something.
   *Example: "We've been working for 10 hours. Let's call it a day."*

7. **Cut somebody some slack** - Don't be so critical.
   *Example: "He's new to the job, cut him some slack."*

8. **Cutting corners** - Doing something poorly in order to save time or money.
   *Example: "They built this house by cutting corners, and now it has many problems."*

9. **Get out of hand** - Get out of control.
   *Example: "The party got a bit out of hand last night."*

10. **Hang in there** - Don't give up.
    *Example: "I know things are tough right now, but hang in there."*
    `,
    excerpt: 'Master these 10 essential English idioms to sound more like a native speaker in your daily conversations.',
    category: 'Idioms',
    tags: ['conversation', 'vocabulary', 'idioms'],
    isPublished: true,
  },
  {
    title: 'Mastering the Present Perfect Tense',
    slug: 'mastering-present-perfect',
    content: `
# Mastering the Present Perfect Tense

The Present Perfect is used to talk about actions that happened at an unspecified time in the past or actions that started in the past and continue to the present.

## Structure
**Subject + have/has + past participle**

### Examples:
* I **have visited** Paris three times.
* She **has worked** here for five years.
* They **have** already **eaten** dinner.

## When to use it?
1. **Experience**: "I have seen that movie before."
2. **Change over time**: "Your English has improved a lot."
3. **Accomplishments**: "Man has walked on the moon."
4. **Unfinished action**: "I have lived here since 2010."
    `,
    excerpt: 'Understand the structures and common uses of the Present Perfect tense with clear examples.',
    category: 'Grammar',
    tags: ['grammar', 'tenses', 'basics'],
    isPublished: true,
  },
  {
    title: 'Top 5 Tips for Improving Your Listening Skills',
    slug: 'top-5-tips-listening',
    content: `
# Top 5 Tips for Improving Your Listening Skills

Listening is often considered the hardest skill to master. Here are five tips to help you improve:

1. **Listen to something every day**: Consistency is key.
2. **Use subtitles wisely**: Start with English subtitles, then try without them.
3. **Listen for the main idea**: Don't worry about every single word at first.
4. **Shadowing**: Repeat what you hear to improve both listening and speaking.
5. **Listen to different accents**: English is spoken differently around the world.
    `,
    excerpt: 'Discover practical strategies to enhance your English listening comprehension and confidence.',
    category: 'Tips',
    tags: ['listening', 'study-tips'],
    isPublished: true,
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Article = mongoose.model('Article', new mongoose.Schema({
      title: String,
      slug: String,
      content: String,
      excerpt: String,
      category: String,
      tags: [String],
      isPublished: Boolean,
      createdAt: { type: Date, default: Date.now }
    }, { timestamps: true }));

    await Article.deleteMany({});
    console.log('Cleared existing articles');

    await Article.insertMany(articles);
    console.log('Database seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
