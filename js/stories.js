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

  return $(`
      <li id="${story.storyId}">
        ${generateStarMarkup(story)}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Returns the markup for the star. */
  function generateStarMarkup(story) {
    if (!currentUser) return "";
    let starClass = currentUser.isFavorite(story) ? "bi-star-fill" : "bi-star";
    return `<i class="star bi ${starClass}"></i>`;
  }

  /** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage($list = $allStoriesList, targetStories = storyList.stories) {
  console.debug("putStoriesOnPage");
  hidePageComponents();
  $list.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of targetStories) {
    const $story = generateStoryMarkup(story);
    $list.append($story);
  }

  $list.show();
}

// /** Gets list of stories from server, generates their HTML, and puts on page. */

// function putStoriesOnPage() {
//   console.debug("putStoriesOnPage");
//   $favoriteStoriesList.hide();
//   $allStoriesList.empty();

//   // loop through all of our stories and generate HTML for them
//   for (let story of storyList.stories) {
//     const $story = generateStoryMarkup(story);
//     $allStoriesList.append($story);
//   }

//   $allStoriesList.show();
// }

/** Get favorite stories from current user, generates their HTML, and puts on page. */

function putFavoriteStoriesOnPage() {
  console.debug("putFavoriteStoriesOnPage");
  $allStoriesList.hide();
  $favoriteStoriesList.empty();

  if (currentUser.favorites.length === 0) {
    $favoriteStoriesList.append("Sorry, you have no favorites").show();
    return;
  }
  // loop through all of our favorite stories and generate HTML for them
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $favoriteStoriesList.append($story);
  }

  $favoriteStoriesList.show();
}

/** Get favorite stories from current user, generates their HTML, and puts on page. */

function putMyStoriesOnPage() {
  console.debug("putMyStoriesOnPage");
  $allStoriesList.hide();
  $favoriteStoriesList.empty();

  if (currentUser.favorites.length === 0) {
    $favoriteStoriesList.append("Sorry, you have no favorites").show();
    return;
  }
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
async function handleToggleFavoriteClick(evt) {
  const $clickTarget = $(evt.target);
  const storyId = $clickTarget.closest('li').attr('id');
  const story = await Story.getStoryById(storyId);

  if ($clickTarget.hasClass("bi-star")) {
    await currentUser.addFavorite(story);
  } else {
    await currentUser.unFavorite(story);
  }
  $clickTarget.toggleClass('bi-star bi-star-fill');
}

$allStoriesList.on("click", ".star", handleToggleFavoriteClick);
$favoriteStoriesList.on("click", ".star", handleToggleFavoriteClick);