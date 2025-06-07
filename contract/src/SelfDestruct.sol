contract SelfDestruct {
    function die() payable public{
        selfdestruct(payable(address(this)));
    }
}