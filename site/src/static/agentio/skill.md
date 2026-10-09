# Install agentio

These instructions are for an AI agent. Follow them to install agentio. agentio lets you read and send email, Slack, WhatsApp, JIRA and other services from the command line, with accounts the user signs in to once.

## 1. Install the CLI

Skip this step if `agentio --version` already works.

macOS and Linux:

    curl -LsSf https://houlahop.com/agentio/install | sh

Windows (PowerShell):

    iwr -useb https://houlahop.com/agentio/install.ps1 | iex

If `agentio` is still not found, use the full path the installer printed (usually `~/.local/bin/agentio`).

## 2. Install the skills

In Claude Code, add the plugin marketplace once, then one plugin per service the user needs:

    claude plugin marketplace add https://github.com/plosson/agentio
    claude plugin install agentio-gmail@agentio

`agentio skill --list` lists the services. In other agents, run `agentio <service> --help` to learn the commands.

## 3. Connect accounts

Ask the user which services they want. For each one, the user runs:

    agentio <service> profile add

It opens a browser to sign in. The user must approve access, so ask them to run it.

## 4. Check

    agentio profile list
    agentio doctor
