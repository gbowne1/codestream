# Contributing to codestream/DevStream development

This project welcomes contributors to help improve its codebase by identifying shortcomings
in the project, highlighting bugs, and issues in the documentation.

This is not a 'for hire' project. It's open source, so contribution to this project 
is based on developer community improvements. This streaming platform was created specifically 
by community developers for developers, hobbyists alike.

This is a PWA.

## What to contribute

Anyone with basic programming skills down contribute immensely to this project.

Areas requiring contribution includes:

-   **Error checks**: Identify any mispellings or errors in documentation

-   **Documentation**: Possess good documentation skills: Good spelling, punctuation, knowledge of Markdown and grammar checker tool, and you believe you can help elevate this projects' documentation even better?

-   **Code contribution**: Identify a bug in this app or thought of a new feature that could plunge this app to a new dimension.

-   **Tests**: Contribute CI, CD, Docker, Unit tests, E2E tests, Integration tests to 
help us ensure PRs don't introduce breaking changes, etc.

-   **Browser Testing**: Ideally this should work with no or minimal browser console errors, warnings, alerts.
If you encounter any specific warnings, errors, alerts.
Ideally this should work across mobile, desktop and many different devices Windows, Mac, Linux and different processor architectures as
well as different browsers.

Please review your browser's console during development.

'console.log' everything necessary to ensure everything is working

Add error messages where necessary 

## How to contribute

These next subheadings will get you started on making your contributions to this project.

## Select an issue

If you are not sure what to work on, review the issues list first. There are also TODO's listed in the included [TODO.md](./TODO.md) file.

@gbowne1 and other project maintainers will assign users to issues on a first come, first serve basis. If you would like to work on an issue, feel free to indicate by tagging the mentioned persons.

> Note: If assigned an issue and along the line you change your mind or can't figure it out, ensure to notify the team immediately so it can be unassigned then reassigned to another.
> it is important to note that some tasks tagged good first issue may not be as simplified and basic to you as it might sound, so it is advisable to look through the issue thoroughly before volunteering.

## Create an issue

Have you noticed a feature that did not look or work right in our applicaton, or a typographical error, wrong syntax, grammar, spelling or other issue?

Check to see if an issue has been created for this in https://github.com/gbowne1/codebooker/issues

If none has been created, Click on the green [New Issue] button.

Describe your issue as well as you can:

-   Include code snippits where the issue lies.
-   Include screenshots (optional).
-   Include a short video (optional).

If the issue appears to be a browser, operating system, device specific issue, let us know what those are.

## Clone or Fork this repository

After choosing what to work on, move to fork and setup your own repository.

## Editor & IDE

The repository contains folders with project appropriate settings
and configurations for Visual Studio code, but beyond that, we are
tool and editor/IDE agnostic so you can use whatever editor or IDE or you like.

The [DEVSETUP](/docs/DEVSETUP.md) file contains instructions for developers on how to:

-   Clone or Fork the project,
-   Set up the project in their IDE or editor,
-   Set up their environment to work in the project, including any environment variables, yarn/npm/pnpm package(s), editor extensions or plugins needed,
-   Setting up the connection to the database,
-   Setting up the local development database, MongoDB.

## Prerequisites to use Database for programmers

Adequate knowledge and familiarity with HTML, CSS, JavaScript ES5/ES6/ES7.

Also, use accessibility (A11y) with themes and styles paying attention to
focus styling, contrast and keyboard accesibility.

Lastly, the browser gives us things like localStorage, IndexedDB, Session Storage,
Cookies and Cache Storage. Make secure usage of all of these 

## Pull Request

Once you are finished working on an issue move to create a Pull Request (PR).

When you create a PR on GitHub, make sure to complete the section on the right which includes:
Assignees, Reviewers, Labels, Projects, Milestone(s) and Development before you submit the PR.

Also, write a brief description of what you fixed. Keep in mind that Blank issues and PR's
without a description of the changes you made may not get merged.

-   Link an issue to Development that the PR will close
-   Make sure that you tag a reviewer i.e. @gbowne1
-   Pick appropriate labels from Labels
-   Make sure you are the assignee to the PR.
-   Milestone, choose Frontend or Backend (more may come later on)

Please provide a short video, copy of log(s), passing tests,
screenshots of working changes. This helps with reviewers knowing 
what to expect with your changes and contributions.

## Style

An official style guide is yet to be released. There is also no existing figma or layout.
this is open to contribution, anyone willing to contribute to create this style guide is
more than welcome, simply create a discussion and let's kickoff from there.

## Versioning

This project runs its application using Semantic Versioning (SemVer).
[Keep a changelog](keepachangelog.com) also provides a CHANGELOG.md for the project;

Use the changelog document accordingly.

## Settings & Configuration

These may not be 100% correct, so we welcome any contribution to make them more accurate
for development, as we believe this will improve the new user first-hand experience
working with our code base.

## Tech Stack

This project was bootstrapped with these libraries, modules, packages 

All core components are built with JSX.

## Branches

Our branches follow GitFlow / GitHub Flow as a general rule.

-   [ main ] main working branch
-   [ master ] Permanent // Archive branch
-   [ test ] untested code
-   Feature Branch # of feature - {feature}
-   [bugfix - { fixed bug }]
-   [hotfix - { fix }]

Use a test branch to commit/push code that you believe should work but is not completely tested.
