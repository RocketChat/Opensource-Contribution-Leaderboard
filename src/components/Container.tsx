import React from 'react';
import styled from 'styled-components';

export default class Container extends React.Component {
    render() {
        return (
            <div className='container'>
                <hr />
                <Contributors>Contributors</Contributors>
                <Total className='total text-muted'>Total:</Total>
                <LastUpdate className='text-muted lastupdate'></LastUpdate>
                <List cellPadding='0' cellSpacing='0'>
                    <tr>
                        <td className='avatar'></td>
                        <td className='username' colSpan={ 1 }>Username</td>
                        <td></td>
                        <td className='open-prs'><a href='#'>Open PRs</a></td>
                        <td className='merged-prs'><a href='#'>Merged PRs</a></td>
                        <td className='issues'><a href='#'>Issues</a></td>
                    </tr>
                </List>
                <hr />
            </div>
        );
    }
}

const Contributors = styled.h2`
    display: inline;
`;

const Total = styled.em`
    font-size: 16px;
    color:#777777;
`;

const LastUpdate = styled.span`
    float:right;
    text-align: right;
    font-size: 12px;
`;

const List = styled.table`
    margin: 0;
    width: 100%;
    font-size: 16px;

    .username {
        font-weight: bold;
        padding: 32px 8px 8px 8px;
        color: #333;
    }

    .open-prs {
        padding: 32px 8px 8px 8px;
        margin: 0; font-size: 12px;
        color: #9BA2AB; font-family: Helvetica, Arial, sans-serif;
    }

    .mered-prs, .issues {
        padding: 32px 8px 8px 8px;
        margin: 0;
        font-size: 12px;
        color: #9BA2AB;
        font-family: Helvetica, Arial, sans-serif;
    }
`;