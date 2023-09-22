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
        ${generateMyStoryMarkup()}
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

/** Returns the markup for the trash and edit. */
function generateMyStoryMarkup() {
  if (!$myStoriesList.hasClass("active")) return "";
  return `<i class='bi bi-pencil-square'></i>
  <i class='bi bi-trash'></i>`;
}


/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage($list = $allStoriesList, targetStories = storyList.stories) {
  console.debug("putStoriesOnPage");
  hidePageComponents();
  $list.empty();

  if (targetStories.length === 0) {
    $list.append("Sorry, no Stories here!").show();
    return;
  }
  // loop through all of our stories and generate HTML for them
  for (let story of targetStories) {
    const $story = generateStoryMarkup(story);
    $list.append($story);
  }

  $list.show();
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

$storiesContainer.on("click", ".star", handleToggleFavoriteClick);

/** Handles Click and Removes story */
async function handleRemoveStoryClick(evt) {
  const $clickTarget = $(evt.target);
  const storyId = $clickTarget.closest('li').attr('id');

  await storyList.removeStory(currentUser, storyId);
  putStoriesOnPage($myStoriesList, currentUser.ownStories);
}

$storiesContainer.on("click", ".bi-trash", handleRemoveStoryClick);

/** Handle click of Edit Story Icon*/
async function handleEditStoryButtonClick(evt) {
  const $clickTarget = $(evt.target);
  const storyId = $clickTarget.closest('li').attr('id');
  const story = await Story.getStoryById(storyId);

  $storyEditTitle.val(story.title);
  $storyEditUrl.val(story.url);
  $storyEditForm.data("story-id", storyId);

  $storyEditForm.show();
}

$storiesContainer.on("click", ".bi-pencil-square", handleEditStoryButtonClick);

/** Handles Click of Cancel Edit Button */
function handleCancelEditStoryButtonClick() {
  $storyEditForm[0].reset();
  $storyEditForm.hide();
}

$storyEditForm.on("click", "#story-edit-exit-button", handleCancelEditStoryButtonClick);

/**  Handles Click of Save Edit Button*/
async function handleSaveEditStoryButtonClick(evt) {
  evt.preventDefault(); // prevent page refresh

  const storyId = $storyEditForm.data("story-id");
  const title = $("#story-edit-title").val();
  const url = $("#story-edit-url").val();

  if (!$storyEditForm.get(0).reportValidity()) return;

  await storyList.editStory(currentUser, storyId, { title, url });

  putStoriesOnPage($myStoriesList, currentUser.ownStories);
  $storyEditForm[0].reset();
  $storyEditForm.hide();
}

$storyEditForm.on("submit", handleSaveEditStoryButtonClick);


