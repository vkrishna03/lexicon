// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenVoting {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 voteWeight;
    }

    struct Election {
        string name;
        uint256 startTime;
        uint256 endTime;
        mapping(address => Voter) voters;
        mapping(uint256 => uint256) votes; // candidateId => total vote weight
        mapping(uint256 => bool) candidates; // Tracks valid candidates
        uint256 totalVotes;
        bool isActive;
    }

    mapping(uint256 => Election) public elections;
    uint256 public electionCount;

    IERC20 public votingToken;
    uint256 public minTokensToRegister = 10 * 1e18; // 10 VOTE tokens required to register
    uint256 public tokensPerVote = 1 * 1e18; // 1 VOTE token per vote

    // Events
    event VoterRegistered(address voter, uint256 voteWeight);
    event ElectionCreated(uint256 electionId, string name);
    event Voted(
        address voter,
        uint256 electionId,
        uint256 candidateId,
        uint256 voteWeight
    );
    event CandidateNominated(uint256 electionId, uint256 candidateId);

    constructor(address tokenAddress) {
        votingToken = IERC20(tokenAddress);
    }

    function registerVoter(uint256 electionId) public {
        require(elections[electionId].isActive, "Election is not active.");
        require(
            block.timestamp < elections[electionId].endTime,
            "Cannot register after election has ended."
        );
        require(
            !elections[electionId].voters[msg.sender].isRegistered,
            "Voter already registered."
        );

        uint256 balance = votingToken.balanceOf(msg.sender);
        require(
            balance >= minTokensToRegister,
            "Not enough tokens to register."
        );

        elections[electionId].voters[msg.sender] = Voter(true, false, balance);
        emit VoterRegistered(msg.sender, balance);
    }

    function createElection(
        string memory name,
        uint256 startTime,
        uint256 endTime
    ) public {
        require(startTime < endTime, "Invalid election time.");

        electionCount++;
        Election storage newElection = elections[electionCount];
        newElection.name = name;
        newElection.startTime = startTime;
        newElection.endTime = endTime;
        newElection.isActive = true;

        emit ElectionCreated(electionCount, name);
    }

    function nominate(uint256 electionId, uint256 candidateId) public {
        require(elections[electionId].isActive, "Election is not active.");
        require(
            !elections[electionId].voters[msg.sender].hasVoted,
            "Cannot nominate after voting."
        );
        require(
            !elections[electionId].candidates[candidateId],
            "Candidate already nominated."
        );

        elections[electionId].candidates[candidateId] = true;
        emit CandidateNominated(electionId, candidateId);
    }

    function vote(uint256 electionId, uint256 candidateId) public {
        require(elections[electionId].isActive, "Election is not active.");
        require(
            block.timestamp >= elections[electionId].startTime,
            "Election has not started."
        );
        require(
            block.timestamp <= elections[electionId].endTime,
            "Election has ended."
        );
        require(
            elections[electionId].voters[msg.sender].isRegistered,
            "Voter not registered."
        );
        require(
            !elections[electionId].voters[msg.sender].hasVoted,
            "Voter has already voted."
        );
        require(
            elections[electionId].candidates[candidateId],
            "Invalid candidate."
        );

        uint256 voteWeight = elections[electionId]
            .voters[msg.sender]
            .voteWeight;
        require(
            votingToken.balanceOf(msg.sender) >= voteWeight,
            "Not enough tokens to vote."
        );
        require(
            votingToken.transferFrom(msg.sender, address(this), voteWeight),
            "Token transfer failed."
        );

        elections[electionId].voters[msg.sender].hasVoted = true;
        elections[electionId].votes[candidateId] += voteWeight;
        elections[electionId].totalVotes += voteWeight;

        emit Voted(msg.sender, electionId, candidateId, voteWeight);
    }

    function getResults(
        uint256 electionId
    ) public view returns (uint256[] memory) {
        require(!elections[electionId].isActive, "Election is still active.");

        uint256 candidateCount = 0;
        for (uint256 i = 0; i < 100; i++) {
            if (elections[electionId].candidates[i]) {
                candidateCount++;
            }
        }

        uint256[] memory results = new uint256[](candidateCount);
        uint256 index = 0;

        for (uint256 i = 0; i < 100; i++) {
            if (elections[electionId].candidates[i]) {
                results[index] = elections[electionId].votes[i];
                index++;
            }
        }

        return results;
    }
}
