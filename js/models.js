"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // const url = new URL(this.url);
    return new URL(this.url).hostname;
  }

  /** takes a story Id and calls the API returns story instance */
  static async getStoryById(storyId) {
    const response = await fetch(`${BASE_URL}/stories/${storyId}`);
    const data = await response.json();

    return new Story(data.story);
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await fetch(`${BASE_URL}/stories`, {
      method: "GET",
    });
    const storiesData = await response.json();

    // turn plain old story objects from API into instances of Story class
    const stories = storiesData.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    const response = await this._setStory("POST", "/stories", {
      token: user.loginToken,
      story: newStory
    });
    const data = await response.json();
    const story = new Story(data.story);
    this.stories.unshift(story);
    user.ownStories.unshift(story);
    return story;
  }
  /**  Takes user and storyId and makes DELETE request to delete from API and updates local storage  */
  async removeStory(user, storyId) {
    await this._setStory("DELETE", `/stories/${storyId}`, {
      token: user.loginToken
    });
    // remove story from story list if it exists
    // remove currentUser.ownStories
    // remove currentUser.favorites
    currentUser.favorites = currentUser.favorites.filter(x => x.storyId !== storyId);
    currentUser.ownStories = currentUser.ownStories.filter(x => x.storyId !== storyId);
    this.stories = this.stories.filter(x => x.storyId !== storyId);

    // this.stories.unshift(story);
    // user.ownStories.unshift(story);
    // return story;
  }
  /**Takes User, storyId, and story and makes fetch call and updates local storage and API */
  async editStory(user, storyId, story) {
    const response = await this._setStory("PATCH", `/stories/${storyId}`, {
      token: user.loginToken,
      story
    });
    const data = await response.json();
    const updatedStory = new Story(data.story);
    // update local lists
    currentUser.favorites.splice(currentUser.favorites.findIndex(x => x.storyId === storyId), 1, updatedStory);
    currentUser.ownStories.splice(currentUser.ownStories.findIndex(x => x.storyId === storyId), 1, updatedStory);
    this.stories.splice(this.stories.findIndex(x => x.storyId === storyId), 1, updatedStory);
  }
  /** takes a method endpoint and body and makes and awaits then ruturns fetch */
  async _setStory(method, endpoint, body) {
    return await fetch(`${BASE_URL}${endpoint}`, {
      method,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
    username,
    name,
    createdAt,
    favorites = [],
    ownStories = []
  },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      body: JSON.stringify({ user: { username, password, name } }),
      headers: {
        "content-type": "application/json",
      }
    });

    if (response.status === 409) {
      throw new Error("Username is taken");
    }

    const userData = await response.json();
    const { user } = userData;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      userData.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      body: JSON.stringify({ user: { username, password } }),
      headers: {
        "content-type": "application/json",
      }
    });

    if (response.status === 401 || response.status === 404) {
      throw new Error("Invalid username or password");
    }

    const userData = await response.json();
    const { user } = userData;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      userData.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const tokenParams = new URLSearchParams({ token });

      const response = await fetch(
        `${BASE_URL}/users/${username}?${tokenParams}`,
        {
          method: "GET"
        }
      );
      const userData = await response.json();
      const { user } = userData;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /** takes a Story Instance and adds to users favorites in API and local array */
  async addFavorite(story) {
    await this._setFavorite("POST", story);
    currentUser.favorites.unshift(story);
  }

  /** takes a Story Instance and removes it from users favorites in API and local array */
  async unFavorite(story) {
    await this._setFavorite("DELETE", story);
    this.favorites = this.favorites.filter(x => x.storyId !== story.storyId);
  }

  /** Takes story instance and returns true or false if in users favorite list */
  isFavorite(story) {
    return this.favorites.find(s => s.storyId === story.storyId);
  }

  async _setFavorite(method, story) {
    await fetch(`${BASE_URL}/users/${currentUser.username}/favorites/${story.storyId}`,
      {
        method,
        body: JSON.stringify({ token: currentUser.loginToken }),
        headers: {
          "content-type": "application/json",
        }
      });
  }

}
