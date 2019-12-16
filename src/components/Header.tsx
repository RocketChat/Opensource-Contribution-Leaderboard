import React from 'react';
import styled from 'styled-components';
import GitHubPNG from '../assets/images/github.png';
import RocketChatSVG from '../assets/images/rocket-chat.svg';
import { GitHubRepoLink } from '../constants';

export default class Header extends React.Component {
    render() {
        return (
            <nav className='navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow'>
                <a className='navbar-brand col-sm-3 col-md-2 mr-0' href='#'>
                    <Logo src={RocketChatSVG} /> GSoC Contribution Leaderboard
                </a>
                <ul className='navbar-nav px-3'>
                    <li className='nav-item text-nowrap'>
                        <a className='nav-link' id='github' href={ GitHubRepoLink } target='_blank'>
                            <Logo src={ GitHubPNG } />
                        </a>
                    </li>
                </ul>
            </nav>
        );
    }
}

const Logo = styled.img`
    height: 42px;
    width: 42px;
`;