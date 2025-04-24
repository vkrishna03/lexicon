// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VotingSystem is Ownable {
    IERC20 public votingToken;

    struct Candidate {
        address candidateAddress;
        string name;
        string manifestoURI;
        uint256 voteCount;
        bool isRegistered;
    }

    struct Election {
        string name;
        string description;
        uint256 nominationStartTime;
        uint256 nominationEndTime;
        uint256 votingStartTime;
        uint256 votingEndTime;
        ElectionState currentState;
        uint256 totalVotes;
        uint256 candidateCount;
        mapping(uint256 => Candidate) candidates;
        mapping(address => bool) hasVoted;
        mapping(address => bool) isNominated;
    }

    enum ElectionState {
        Created, // Election is created but nomination hasn't started
        Nomination, // Nomination period is active
        PreVoting, // Between nomination end and voting start
        Voting, // Voting is active
        Ended // Election has ended
    }

    mapping(uint256 => Election) public elections;
    uint256 public electionCount;

    // Configuration
    uint256 public minimumTokensToNominate;
    uint256 public minimumTokensToVote;

    // Events
    event ElectionCreated(
        uint256 indexed electionId,
        string name,
        uint256 timestamp
    );
    event CandidateNominated(
        uint256 indexed electionId,
        address indexed candidate,
        string name
    );
    event VoteCast(
        uint256 indexed electionId,
        address indexed voter,
        uint256 timestamp
    );
    event ElectionStateChanged(
        uint256 indexed electionId,
        ElectionState newState
    );

    constructor(address _votingToken) Ownable(msg.sender) {
        votingToken = IERC20(_votingToken);
        minimumTokensToNominate = 100 * 10 ** 18; // 100 tokens
        minimumTokensToVote = 1 * 10 ** 18; // 1 token
    }

    // Admin Functions
    function createElection(
        string memory _name,
        string memory _description,
        uint256 _nominationStartTime,
        uint256 _nominationEndTime,
        uint256 _votingStartTime,
        uint256 _votingEndTime
    ) external onlyOwner {
        require(
            _nominationStartTime < _nominationEndTime,
            "Invalid nomination period"
        );
        require(
            _nominationEndTime < _votingStartTime,
            "Nomination must end before voting"
        );
        require(_votingStartTime < _votingEndTime, "Invalid voting period");

        electionCount++;
        Election storage election = elections[electionCount];

        election.name = _name;
        election.description = _description;
        election.nominationStartTime = _nominationStartTime;
        election.nominationEndTime = _nominationEndTime;
        election.votingStartTime = _votingStartTime;
        election.votingEndTime = _votingEndTime;
        election.currentState = ElectionState.Created;

        emit ElectionCreated(electionCount, _name, block.timestamp);
    }

    // Nomination Functions
    function nominateCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _manifestoURI
    ) external {
        Election storage election = elections[_electionId];

        require(
            block.timestamp >= election.nominationStartTime,
            "Nomination period not started"
        );
        require(
            block.timestamp <= election.nominationEndTime,
            "Nomination period ended"
        );
        require(!election.isNominated[msg.sender], "Already nominated");
        require(
            votingToken.balanceOf(msg.sender) >= minimumTokensToNominate,
            "Insufficient tokens to nominate"
        );

        election.candidateCount++;
        Candidate storage newCandidate = election.candidates[
            election.candidateCount
        ];
        newCandidate.candidateAddress = msg.sender;
        newCandidate.name = _name;
        newCandidate.manifestoURI = _manifestoURI;
        newCandidate.isRegistered = true;

        election.isNominated[msg.sender] = true;

        emit CandidateNominated(_electionId, msg.sender, _name);
    }

    // Voting Functions
    function castVote(uint256 _electionId, uint256 _candidateId) external {
        Election storage election = elections[_electionId];

        require(
            block.timestamp >= election.votingStartTime,
            "Voting not started"
        );
        require(block.timestamp <= election.votingEndTime, "Voting ended");
        require(!election.hasVoted[msg.sender], "Already voted");
        require(
            election.candidates[_candidateId].isRegistered,
            "Invalid candidate"
        );
        require(
            votingToken.balanceOf(msg.sender) >= minimumTokensToVote,
            "Insufficient tokens to vote"
        );

        uint256 votingPower = votingToken.balanceOf(msg.sender);
        require(
            votingToken.transferFrom(msg.sender, address(this), votingPower),
            "Token transfer failed"
        );

        election.candidates[_candidateId].voteCount += votingPower;
        election.totalVotes += votingPower;
        election.hasVoted[msg.sender] = true;

        emit VoteCast(_electionId, msg.sender, block.timestamp);
    }

    // View Functions
    function getElectionDetails(
        uint256 _electionId
    )
        external
        view
        returns (
            string memory name,
            string memory description,
            uint256 nominationStart,
            uint256 nominationEnd,
            uint256 votingStart,
            uint256 votingEnd,
            ElectionState state,
            uint256 totalVotes
        )
    {
        Election storage election = elections[_electionId];
        return (
            election.name,
            election.description,
            election.nominationStartTime,
            election.nominationEndTime,
            election.votingStartTime,
            election.votingEndTime,
            election.currentState,
            election.totalVotes
        );
    }

    function getCandidateDetails(
        uint256 _electionId,
        uint256 _candidateId
    )
        external
        view
        returns (
            address candidateAddress,
            string memory name,
            string memory manifestoURI,
            uint256 voteCount
        )
    {
        Candidate storage candidate = elections[_electionId].candidates[
            _candidateId
        ];
        return (
            candidate.candidateAddress,
            candidate.name,
            candidate.manifestoURI,
            candidate.voteCount
        );
    }

    function updateElectionState(uint256 _electionId) external {
        Election storage election = elections[_electionId];
        uint256 currentTime = block.timestamp;

        if (currentTime < election.nominationStartTime) {
            election.currentState = ElectionState.Created;
        } else if (
            currentTime >= election.nominationStartTime &&
            currentTime <= election.nominationEndTime
        ) {
            election.currentState = ElectionState.Nomination;
        } else if (
            currentTime > election.nominationEndTime &&
            currentTime < election.votingStartTime
        ) {
            election.currentState = ElectionState.PreVoting;
        } else if (
            currentTime >= election.votingStartTime &&
            currentTime <= election.votingEndTime
        ) {
            election.currentState = ElectionState.Voting;
        } else {
            election.currentState = ElectionState.Ended;
        }

        emit ElectionStateChanged(_electionId, election.currentState);
    }

    // Get all candidates for an election
    function getAllCandidates(
        uint256 _electionId
    )
        external
        view
        returns (
            uint256[] memory candidateIds,
            address[] memory candidateAddresses,
            string[] memory names,
            string[] memory manifestoURIs,
            uint256[] memory voteCounts
        )
    {
        Election storage election = elections[_electionId];
        uint256 count = election.candidateCount;

        candidateIds = new uint256[](count);
        candidateAddresses = new address[](count);
        names = new string[](count);
        manifestoURIs = new string[](count);
        voteCounts = new uint256[](count);

        for (uint256 i = 1; i <= count; i++) {
            Candidate storage candidate = election.candidates[i];
            candidateIds[i - 1] = i;
            candidateAddresses[i - 1] = candidate.candidateAddress;
            names[i - 1] = candidate.name;
            manifestoURIs[i - 1] = candidate.manifestoURI;
            voteCounts[i - 1] = candidate.voteCount;
        }

        return (
            candidateIds,
            candidateAddresses,
            names,
            manifestoURIs,
            voteCounts
        );
    }

    // Get all active elections
    function getActiveElections() external view returns (uint256[] memory) {
        uint256 activeCount = 0;

        // First, count active elections
        for (uint256 i = 1; i <= electionCount; i++) {
            if (elections[i].currentState != ElectionState.Ended) {
                activeCount++;
            }
        }

        uint256[] memory activeElections = new uint256[](activeCount);
        uint256 currentIndex = 0;

        // Then populate the array
        for (uint256 i = 1; i <= electionCount; i++) {
            if (elections[i].currentState != ElectionState.Ended) {
                activeElections[currentIndex] = i;
                currentIndex++;
            }
        }

        return activeElections;
    }

    // Check if user has voted in an election
    function hasUserVoted(
        uint256 _electionId,
        address _user
    ) external view returns (bool) {
        return elections[_electionId].hasVoted[_user];
    }

    // Get user's voting power (token balance)
    function getVotingPower(address _user) external view returns (uint256) {
        return votingToken.balanceOf(_user);
    }

    // Get election results (only after election has ended)
    function getElectionResults(
        uint256 _electionId
    )
        external
        view
        returns (
            uint256[] memory candidateIds,
            string[] memory candidateNames,
            uint256[] memory voteCounts,
            uint256 totalVotesCast
        )
    {
        Election storage election = elections[_electionId];
        require(
            election.currentState == ElectionState.Ended,
            "Election not ended"
        );

        uint256 count = election.candidateCount;
        candidateIds = new uint256[](count);
        candidateNames = new string[](count);
        voteCounts = new uint256[](count);

        for (uint256 i = 1; i <= count; i++) {
            Candidate storage candidate = election.candidates[i];
            candidateIds[i - 1] = i;
            candidateNames[i - 1] = candidate.name;
            voteCounts[i - 1] = candidate.voteCount;
        }

        return (candidateIds, candidateNames, voteCounts, election.totalVotes);
    }

    // Get current election state with time information
    function getElectionTimeStatus(
        uint256 _electionId
    )
        external
        view
        returns (
            ElectionState currentState,
            uint256 timeUntilNext,
            string memory currentPhase
        )
    {
        Election storage election = elections[_electionId];
        uint256 currentTime = block.timestamp;

        if (currentTime < election.nominationStartTime) {
            return (
                ElectionState.Created,
                election.nominationStartTime - currentTime,
                "Waiting for nominations to start"
            );
        } else if (currentTime <= election.nominationEndTime) {
            return (
                ElectionState.Nomination,
                election.nominationEndTime - currentTime,
                "Nomination period active"
            );
        } else if (currentTime < election.votingStartTime) {
            return (
                ElectionState.PreVoting,
                election.votingStartTime - currentTime,
                "Waiting for voting to start"
            );
        } else if (currentTime <= election.votingEndTime) {
            return (
                ElectionState.Voting,
                election.votingEndTime - currentTime,
                "Voting period active"
            );
        } else {
            return (ElectionState.Ended, 0, "Election ended");
        }
    }

    // Check if a user can nominate themselves
    function canNominate(
        uint256 _electionId,
        address _user
    ) external view returns (bool isEligible, string memory message) {
        Election storage election = elections[_electionId];

        if (block.timestamp < election.nominationStartTime) {
            return (false, "Nomination period not started");
        }
        if (block.timestamp > election.nominationEndTime) {
            return (false, "Nomination period ended");
        }
        if (election.isNominated[_user]) {
            return (false, "Already nominated");
        }
        if (votingToken.balanceOf(_user) < minimumTokensToNominate) {
            return (false, "Insufficient tokens");
        }

        return (true, "Eligible to nominate");
    }

    // Check if a user can vote
    function canVote(
        uint256 _electionId,
        address _user
    ) external view returns (bool isEligible, string memory message) {
        Election storage election = elections[_electionId];

        if (block.timestamp < election.votingStartTime) {
            return (false, "Voting period not started");
        }
        if (block.timestamp > election.votingEndTime) {
            return (false, "Voting period ended");
        }
        if (election.hasVoted[_user]) {
            return (false, "Already voted");
        }
        if (votingToken.balanceOf(_user) < minimumTokensToVote) {
            return (false, "Insufficient tokens");
        }

        return (true, "Eligible to vote");
    }
}
