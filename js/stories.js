"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const isFavorite = currentUser.isFavorite(story);

  return $(`
      <li id="${story.storyId}">
        <i class="star bi ${isFavorite ? "bi-star-fill" : "bi-star"}"></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");
  $favoriteStoriesList.hide();
  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** Get favorite stories from current user, generates their HTML, and puts on page. */

function putFavoriteStoriesOnPage() {
  console.debug("putFavoriteStoriesOnPage");
  $allStoriesList.hide();
  $favoriteStoriesList.empty();

  // loop through all of our favorite stories and generate HTML for them
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $favoriteStoriesList.append($story);
  }

  $favoriteStoriesList.show();
}

/** Retrieves data from '#story-submit-form and displays new story on page*/

async function handleSubmitStory(evt) {
  evt.preventDefault(); // prevent page refresh

  const author = $("#author-name").val();
  const title = $("#story-title").val();
  const url = $("#story-url").val();

  if (!$storySubmitForm.get(0).reportValidity()) return;

  const story = await storyList.addStory(currentUser, { title, author, url });
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  $storySubmitForm[0].reset();
  $storySubmitForm.hide();
}

$storySubmitForm.on("submit", handleSubmitStory);

/** Handles Click and Adds or Removes story to favorites based on current state */
async function handleToggleFavorite(evt) {
  const $clickTarget = $(evt.target);
  const storyId = $clickTarget.closest('li').attr('id');
  const story = await Story.getStoryFromId(storyId);

  if (!currentUser.isFavorite(story)) {
    currentUser.addFavorite(story);
  } else {
    currentUser.unFavorite(story);
  }
  $clickTarget.toggleClass('bi-star bi-star-fill');
}

$allStoriesList.on("click", ".star", handleToggleFavorite);
$favoriteStoriesList.on("click", ".star", handleToggleFavorite);