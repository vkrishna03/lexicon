// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../tokens/VotingToken.sol";

contract ElectionManager is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant ELECTION_ADMIN_ROLE =
        keccak256("ELECTION_ADMIN_ROLE");
    bytes32 public constant ROLLUP_OPERATOR_ROLE =
        keccak256("ROLLUP_OPERATOR_ROLE");

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
    }

    struct BatchVote {
        uint256[] proposalIds;
        bool[] voteSupport;
        uint256[] amounts;
        bytes32 batchRoot; // Merkle root of votes for L2 verification
    }

    VotingToken public token;
    uint256 public proposalCount;
    uint256 public minimumQuorum;
    uint256 public votingDelay;
    uint256 public votingPeriod;

    // L2 rollup bridge address
    address public l2Bridge;

    mapping(uint256 => Proposal) public proposals;
    mapping(bytes32 => bool) public processedBatches;

    event ProposalCreated(
        uint256 indexed proposalId,
        address proposer,
        string description,
        uint256 startTime,
        uint256 endTime
    );

    event VoteBatched(
        bytes32 indexed batchId,
        address indexed voter,
        uint256 timestamp
    );

    event ProposalExecuted(uint256 indexed proposalId);

    constructor(
        address _token,
        address _l2Bridge,
        uint256 _minimumQuorum,
        uint256 _votingDelay,
        uint256 _votingPeriod
    ) {
        token = VotingToken(_token);
        l2Bridge = _l2Bridge;
        minimumQuorum = _minimumQuorum;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ELECTION_ADMIN_ROLE, msg.sender);
        _grantRole(ROLLUP_OPERATOR_ROLE, _l2Bridge);
    }

    function createProposal(
        string memory description,
        uint256 startTime
    ) public whenNotPaused returns (uint256) {
        require(
            token.balanceOf(msg.sender) >= minimumQuorum,
            "Insufficient tokens to create proposal"
        );

        // In createProposal function:
        require(
            startTime > block.timestamp,
            "Start time must be in the future"
        );

        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.startTime = startTime + votingDelay;
        proposal.endTime = proposal.startTime + votingPeriod;

        emit ProposalCreated(
            proposalCount,
            msg.sender,
            description,
            proposal.startTime,
            proposal.endTime
        );

        return proposalCount;
    }

    function submitBatchVote(
        BatchVote memory batchVote
    ) external whenNotPaused onlyRole(ROLLUP_OPERATOR_ROLE) nonReentrant {
        require(
            !processedBatches[batchVote.batchRoot],
            "Batch already processed"
        );

        // In submitBatchVote function:
        require(batchVote.proposalIds.length > 0, "Empty batch");
        require(
            batchVote.proposalIds.length == batchVote.voteSupport.length &&
                batchVote.proposalIds.length == batchVote.amounts.length,
            "Array length mismatch"
        );

        // Process the batch of votes from L2
        for (uint i = 0; i < batchVote.proposalIds.length; i++) {
            Proposal storage proposal = proposals[batchVote.proposalIds[i]];

            require(proposal.id != 0, "Proposal doesn't exist");
            require(
                block.timestamp >= proposal.startTime &&
                    block.timestamp <= proposal.endTime,
                "Proposal not active"
            );

            if (batchVote.voteSupport[i]) {
                proposal.forVotes += batchVote.amounts[i];
            } else {
                proposal.againstVotes += batchVote.amounts[i];
            }
        }

        processedBatches[batchVote.batchRoot] = true;
        emit VoteBatched(batchVote.batchRoot, msg.sender, block.timestamp);
    }

    function executeProposal(
        uint256 proposalId
    ) external onlyRole(ELECTION_ADMIN_ROLE) {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(
            (proposal.forVotes + proposal.againstVotes) >= minimumQuorum,
            "Quorum not reached"
        );

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }

    // Admin functions
    function setVotingDelay(
        uint256 newVotingDelay
    ) external onlyRole(ELECTION_ADMIN_ROLE) {
        votingDelay = newVotingDelay;
    }

    function setVotingPeriod(
        uint256 newVotingPeriod
    ) external onlyRole(ELECTION_ADMIN_ROLE) {
        votingPeriod = newVotingPeriod;
    }

    function setMinimumQuorum(
        uint256 newMinimumQuorum
    ) external onlyRole(ELECTION_ADMIN_ROLE) {
        minimumQuorum = newMinimumQuorum;
    }

    function pause() external onlyRole(ELECTION_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ELECTION_ADMIN_ROLE) {
        _unpause();
    }
}
